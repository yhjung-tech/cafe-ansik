-- =============================================================================
-- 카페 안식 — 마감 보고 슬랙 자동 발송
-- -----------------------------------------------------------------------------
-- 매일 오전 9시(KST)에 전날의 마감 기록(판매량 · 마감자 · 특이사항)을
-- 슬랙 채널로 자동 발송한다. 모두 Supabase Postgres 안에서 동작하며 별도 서버가 없다.
--
--   pg_cron 'cafe-ansik-slack-report'        00:00 UTC = 09:00 KST
--     └─ cafe_ansik_send_slack_report()      전날 기록으로 메시지 생성 → pg_net으로 Slack chat.postMessage 호출
--   pg_cron 'cafe-ansik-slack-report-check'  00:05 UTC
--     └─ cafe_ansik_check_slack_report()     Slack 응답을 cafe_ansik_slack_report_log 에 기록
--
-- 사전 준비
--   Vault 시크릿 'cafe_ansik_slack_bot_token' 에 Slack 봇 토큰(xoxb-…)을 저장한다.
--     select vault.create_secret('xoxb-…', 'cafe_ansik_slack_bot_token', '카페 안식 마감 보고 슬랙 봇');
--   봇 앱에는 chat:write 스코프가 있어야 하고, 대상 채널에 봇을 초대(/invite)해야 한다.
--
-- 수동 실행 / 확인
--   select public.cafe_ansik_send_slack_report('2026-09-01');  -- 특정 날짜 보고 (다시) 보내기
--   select public.cafe_ansik_check_slack_report();              -- Slack 응답 수집 (발송 몇 초 뒤)
--   select * from public.cafe_ansik_slack_report_log order by id desc limit 10;
-- =============================================================================

-- 1) 발송 로그 -----------------------------------------------------------------
create table if not exists public.cafe_ansik_slack_report_log (
  id           bigint generated always as identity primary key,
  report_date  date        not null,
  channel      text        not null,
  request_id   bigint,                        -- pg_net 요청 id (net._http_response.id)
  sent_at      timestamptz not null default now(),
  http_status  integer,
  slack_ok     boolean,                       -- Slack 응답의 ok 값
  response     text,                          -- Slack 응답 본문 또는 오류 메모
  checked_at   timestamptz
);
comment on table public.cafe_ansik_slack_report_log
  is '카페 안식 마감 보고 슬랙 발송 로그 (pg_cron → pg_net → Slack chat.postMessage)';
alter table public.cafe_ansik_slack_report_log enable row level security;
revoke all on table public.cafe_ansik_slack_report_log from anon, authenticated;

-- 2) 메시지 생성 (DB만 읽는 순수 함수 — 미리보기/테스트용) ----------------------------
create or replace function public.cafe_ansik_slack_message(p_date date, p_channel text)
returns jsonb
language plpgsql
stable
set search_path = public
as $fn$
declare
  v_row        public.cafe_ansik_daily_sales%rowtype;
  v_weekday    text := (array['일','월','화','수','목','금','토'])[extract(dow from p_date)::int + 1];
  v_date_label text := format('%s월 %s일 (%s)', extract(month from p_date)::int, extract(day from p_date)::int, v_weekday);
  v_title      text := '☕ 카페 안식 마감 보고 · ' || v_date_label;
  v_footer     jsonb := jsonb_build_object('type', 'context', 'elements', jsonb_build_array(
                          jsonb_build_object('type', 'mrkdwn', 'text', '카페 안식 앱 · 매일 오전 9시 자동 발송')));
  v_tea        record;
  v_ice        integer;
  v_hot        integer;
  v_staff      integer;
  v_sold       integer := 0;
  v_staff_sum  integer := 0;
  v_lines      text := '';
  v_closer     text;
  v_note       text;
  v_saved_at   text;
begin
  select * into v_row from public.cafe_ansik_daily_sales where sale_date = p_date;

  if not found then
    return jsonb_build_object(
      'channel', p_channel,
      'text', format('[카페 안식 마감 보고] %s · 저장된 마감 기록이 없습니다', v_date_label),
      'blocks', jsonb_build_array(
        jsonb_build_object('type', 'header',
          'text', jsonb_build_object('type', 'plain_text', 'text', v_title, 'emoji', true)),
        jsonb_build_object('type', 'section',
          'text', jsonb_build_object('type', 'mrkdwn', 'text',
            E':warning: 이 날짜의 마감 기록이 아직 저장되지 않았습니다.\n앱 *입력* 화면에서 날짜를 선택해 판매량과 마감자를 입력해 주세요.')),
        v_footer),
      'unfurl_links', false, 'unfurl_media', false);
  end if;

  -- 차별 집계 (src/drinks.js 의 TEAS/VARIANTS 와 같은 구조: {tea}_ice / {tea}_hot / {tea}_staff)
  for v_tea in select * from (values ('memil', '메밀차'), ('yeonip', '연잎차')) as t(id, name) loop
    v_ice   := coalesce((v_row.drinks ->> (v_tea.id || '_ice'))::integer, 0);
    v_hot   := coalesce((v_row.drinks ->> (v_tea.id || '_hot'))::integer, 0);
    v_staff := coalesce((v_row.drinks ->> (v_tea.id || '_staff'))::integer, 0);
    v_sold      := v_sold + v_ice + v_hot;
    v_staff_sum := v_staff_sum + v_staff;
    v_lines := v_lines || format(E'\n• *%s*  ICE %s · HOT %s · 직원 %s  (%s잔)',
                                 v_tea.name, v_ice, v_hot, v_staff, v_ice + v_hot + v_staff);
  end loop;

  -- 사용자 입력 텍스트는 Slack mrkdwn 특수문자(& < >)를 이스케이프한다
  v_closer   := replace(replace(replace(coalesce(v_row.closer, '미지정'), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
  v_saved_at := to_char(v_row.updated_at at time zone 'Asia/Seoul', 'MM/DD HH24:MI');
  v_note     := nullif(btrim(replace(coalesce(v_row.note, ''), E'\r', '')), '');
  if v_note is null then
    v_note := '_(없음)_';
  else
    v_note := replace(replace(replace(left(v_note, 2500), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
    v_note := '> ' || replace(v_note, E'\n', E'\n> ');
  end if;

  return jsonb_build_object(
    'channel', p_channel,
    'text', format('[카페 안식 마감 보고] %s · 총 %s잔 (판매 %s · 직원 %s) · 마감자 %s',
                   v_date_label, v_sold + v_staff_sum, v_sold, v_staff_sum, coalesce(v_row.closer, '미지정')),
    'blocks', jsonb_build_array(
      jsonb_build_object('type', 'header',
        'text', jsonb_build_object('type', 'plain_text', 'text', v_title, 'emoji', true)),
      jsonb_build_object('type', 'section',
        'text', jsonb_build_object('type', 'mrkdwn', 'text',
          format('*판매량*  총 %s잔  (판매 %s잔 · 직원 %s잔)', v_sold + v_staff_sum, v_sold, v_staff_sum) || v_lines)),
      jsonb_build_object('type', 'section',
        'fields', jsonb_build_array(
          jsonb_build_object('type', 'mrkdwn', 'text', E'*마감자*\n' || v_closer),
          jsonb_build_object('type', 'mrkdwn', 'text', E'*저장 시각*\n' || v_saved_at))),
      jsonb_build_object('type', 'section',
        'text', jsonb_build_object('type', 'mrkdwn', 'text', E'*특이사항*\n' || v_note)),
      v_footer),
    'unfurl_links', false, 'unfurl_media', false);
end
$fn$;

-- 3) 발송: 메시지를 만들어 pg_net으로 Slack에 보내고 로그를 남긴다 -----------------------
create or replace function public.cafe_ansik_send_slack_report(
  p_date    date default null,            -- 기본값: 한국 시간 기준 어제
  p_channel text default 'C0AULCS43JT'    -- 마감 보고 슬랙 채널 ID
)
returns bigint                            -- pg_net 요청 id (토큰이 없으면 null)
language plpgsql
set search_path = public
as $fn$
declare
  v_date       date := coalesce(p_date, (now() at time zone 'Asia/Seoul')::date - 1);
  v_token      text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
    from vault.decrypted_secrets
   where name = 'cafe_ansik_slack_bot_token'
   order by created_at desc
   limit 1;

  if coalesce(v_token, '') = '' then
    insert into public.cafe_ansik_slack_report_log (report_date, channel, slack_ok, response, checked_at)
    values (v_date, p_channel, false, 'skipped: Vault 시크릿 cafe_ansik_slack_bot_token 이 없습니다', now());
    raise warning 'cafe_ansik_send_slack_report: Vault secret cafe_ansik_slack_bot_token not set (report_date=%)', v_date;
    return null;
  end if;

  v_request_id := net.http_post(
    url                  := 'https://slack.com/api/chat.postMessage',
    body                 := public.cafe_ansik_slack_message(v_date, p_channel),
    headers              := jsonb_build_object(
                              'Content-Type',  'application/json',   -- pg_net은 정확히 application/json 만 허용
                              'Authorization', 'Bearer ' || v_token),
    timeout_milliseconds := 10000
  );

  insert into public.cafe_ansik_slack_report_log (report_date, channel, request_id)
  values (v_date, p_channel, v_request_id);

  return v_request_id;
end
$fn$;

-- 4) 응답 수집: pg_net 응답(약 6시간 보관)을 로그에 옮긴다 ------------------------------
create or replace function public.cafe_ansik_check_slack_report()
returns integer                           -- 갱신한 로그 행 수
language plpgsql
set search_path = public
as $fn$
declare
  v_updated integer := 0;
  v_expired integer := 0;
begin
  update public.cafe_ansik_slack_report_log l
     set http_status = r.status_code,
         slack_ok    = case when r.content ~ '^\s*\{' then (r.content::jsonb ->> 'ok')::boolean end,
         response    = left(coalesce(r.content, r.error_msg, case when r.timed_out then 'timed out' end), 2000),
         checked_at  = now()
    from net._http_response r
   where r.id = l.request_id
     and l.checked_at is null;
  get diagnostics v_updated = row_count;

  update public.cafe_ansik_slack_report_log
     set response   = 'no response found (pg_net response expired)',
         checked_at = now()
   where checked_at is null
     and sent_at < now() - interval '7 hours';
  get diagnostics v_expired = row_count;

  return v_updated + v_expired;
end
$fn$;

-- 5) 권한: PostgREST(anon/authenticated/service_role)로 호출되지 않도록 막는다 ------------
revoke execute on function public.cafe_ansik_slack_message(date, text)     from public, anon, authenticated, service_role;
revoke execute on function public.cafe_ansik_send_slack_report(date, text) from public, anon, authenticated, service_role;
revoke execute on function public.cafe_ansik_check_slack_report()          from public, anon, authenticated, service_role;

-- 6) 스케줄 (cron.timezone = GMT → 00:00 UTC = 09:00 KST) ---------------------------------
select cron.schedule('cafe-ansik-slack-report',       '0 0 * * *', $cmd$ select public.cafe_ansik_send_slack_report(); $cmd$);
select cron.schedule('cafe-ansik-slack-report-check', '5 0 * * *', $cmd$ select public.cafe_ansik_check_slack_report(); $cmd$);
