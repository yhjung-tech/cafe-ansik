-- =============================================================================
-- 카페 안식 — 마감 보고 슬랙 DM 수신자 교체 (유진호 → 윤진형)
-- -----------------------------------------------------------------------------
-- 채널(C0AULCS43JT)로 가는 매일 09:00 KST 마감 보고와 같은 메시지를 받는 DM 수신자를
-- 유진호(jh.yoo, U0C1T1386SJ — 퇴사)에서 윤진형(jh.yoon, U0CKV9H4S9H)으로 바꾼다.
-- 방식은 20261006_cafe_ansik_slack_report_dm.sql 과 같고 사람만 다르다.
--
--   pg_cron 'cafe-ansik-slack-report-dm-jh-yoon'  00:00 UTC = 09:00 KST
--     └─ cafe_ansik_send_slack_report(p_channel => 'U0CKV9H4S9H')
--
-- Slack 응답은 기존 'cafe-ansik-slack-report-check'(00:05 UTC)가 함께 수집한다
-- (cafe_ansik_slack_report_log 의 channel = 'U0CKV9H4S9H' 행).
--
-- 적용 전 확인(2026-11-23): 봇 토큰으로 윤진형 DM 에 chat.scheduleMessage → 바로
-- chat.deleteScheduledMessage (ok:true, DM 채널 D0CKP7U0T2T, 남은 예약 0건) — DM 에 흔적 없음.
--
-- 수신자 추가: 잡 이름과 사용자 ID만 바꿔 같은 형태로 하나 더 만든다.
-- 중단:       select cron.unschedule('cafe-ansik-slack-report-dm-jh-yoon');
-- =============================================================================

select cron.unschedule('cafe-ansik-slack-report-dm-jh-yoo');

select cron.schedule('cafe-ansik-slack-report-dm-jh-yoon', '0 0 * * *',
  $cmd$ select public.cafe_ansik_send_slack_report(p_channel => 'U0CKV9H4S9H'); $cmd$);
