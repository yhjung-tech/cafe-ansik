-- =============================================================================
-- 카페 안식 — 마감 보고 슬랙 DM 수신자 추가
-- -----------------------------------------------------------------------------
-- 채널(C0AULCS43JT)로 가는 매일 09:00 KST 마감 보고와 같은 메시지를
-- 유진호(jh.yoo, U0C1T1386SJ)에게 카페 안식 봇 DM으로도 보낸다.
--
--   pg_cron 'cafe-ansik-slack-report-dm-jh-yoo'  00:00 UTC = 09:00 KST
--     └─ cafe_ansik_send_slack_report(p_channel => 'U0C1T1386SJ')
--
-- chat.postMessage 의 channel 에 사용자 ID(U…)를 넣으면 봇과의 DM으로 간다 (chat:write 스코프로 충분).
-- 채널 발송과 잡을 나눠 두어 한쪽이 실패해도 다른 쪽은 그대로 나간다.
-- Slack 응답은 기존 'cafe-ansik-slack-report-check'(00:05 UTC)가 함께 수집한다
-- (cafe_ansik_slack_report_log 의 channel = 'U0C1T1386SJ' 행).
--
-- 수신자 추가: 잡 이름과 사용자 ID만 바꿔 같은 형태로 하나 더 만든다.
-- 중단:       select cron.unschedule('cafe-ansik-slack-report-dm-jh-yoo');
-- =============================================================================

select cron.schedule('cafe-ansik-slack-report-dm-jh-yoo', '0 0 * * *',
  $cmd$ select public.cafe_ansik_send_slack_report(p_channel => 'U0C1T1386SJ'); $cmd$);
