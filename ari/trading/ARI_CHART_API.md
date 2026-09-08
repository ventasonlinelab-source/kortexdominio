# A.R.I. Chart Engine · API interna V1

Superficie global: `window.ARI_CHART_API`.

El motor es soberano de A.R.I. y no depende de un iframe de TradingView. Los dibujos se almacenan como objetos anclados a `timestamp` + `precio` bajo XAUUSD; el estado local durable usa la clave `ari-chart-drawings-v1:XAUUSD:default`.

## Timeframe
- `getTimeframe()`
- `setTimeframe('M1'|'M5'|'M15'|'M30'|'H1'|'H4'|'D'|'W'|'MN')`

## Dibujos
- `getDrawings()`
- `createDrawing({type,p1,p2?,text?})`
- `updateDrawing(id, patch)`
- `removeDrawing(id)`
- `clearDrawings()`
- `exportState()`
- `importState(state)`

Tipos V1: `horizontal`, `trend`, `ray`, `rect`, `text`.

Puntos: `{t: <epoch_ms>, p: <precio>}`.

## Feed
- `reload()`
- `getFeedState()`

Frontend consume únicamente `/api/ari-trading-feed`; secretos quedan server-side. El adaptador prioriza `ARI_TRADING_FEED_URL` si existe y, como fallback, OANDA server-side mediante `ARI_OANDA_API_TOKEN`/`OANDA_API_TOKEN`.

## Eventos DOM
Emitidos sobre el mount del engine:
- `ari-chart:ready`
- `ari-chart:interval`
- `ari-chart:data`
- `ari-chart:error`
- `ari-chart:drawings-change`

Esta superficie está preparada para una futura capa GPT que cree/modifique dibujos y, posteriormente, alertas/eventos macro sin manipular coordenadas de pantalla.