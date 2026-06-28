-- Comercial › Oportunidades › Prospeção Ativa — canal de origem do lead outbound.
-- Campo exclusivo desta List; o rastreio de UTM (utm_source…) é exclusivo de Tráfego Pago.
ALTER TABLE task_oportunidade
  ADD COLUMN IF NOT EXISTS origem text;
