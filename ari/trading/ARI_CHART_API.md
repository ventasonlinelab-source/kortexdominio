# A.R.I. Chart Engine · API interna V1.4

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

Tipos: `horizontal`, `trend`, `ray`, `rect`, `text`.

Puntos: `{t: <epoch_ms>, p: <precio>}`.

## Favoritos reales de toolbar
- `getFavoriteTools()`
- `setFavoriteTools(['horizontal','rect','alert', ...])`
- `toggleFavoriteTool(tool)`

La selección queda persistida bajo XAUUSD y se materializa como herramientas fijadas dentro de la propia toolbar izquierda.

## Undo / Redo
- `undo()`
- `redo()`
- `getHistoryState()` → `{undo, redo}`

El historial cubre dibujos y alertas de precio, conserva hasta 50 checkpoints y se mantiene durable mientras el estado actual siga correspondiendo al historial guardado.

## Alertas de precio A.R.I.
- `getPriceAlerts()`
- `createPriceAlert(price, {label?})`
- `updatePriceAlert(id, {price?, label?, active?})`
- `removePriceAlert(id)`
- `selectPriceAlert(id|null)`

Contrato visual: cada alerta vive dentro del gráfico como nivel horizontal + marcador. Se puede crear desde la herramienta `alert`, seleccionar, arrastrar verticalmente para modificar el precio y eliminar con Delete/Backspace o el control de borrado seleccionado. Las alertas persisten por XAUUSD bajo `ari-chart-price-alerts-v1:XAUUSD:default`.

Cuando el precio vivo cruza el nivel, la alerta pasa a disparada, emite `ari-chart:price-alert-triggered` y muestra aviso dentro del chart. Si el navegador ya tiene permiso de notificaciones concedido, A.R.I. puede reflejar también el disparo mediante Notification API sin solicitar permisos desde esta capa.

## Movilidad / vista
- `getFreePanState()`
- `resetView()`

## Feed
- `reload()`
- `getFeedState()`

Frontend consume únicamente `/api/ari-trading-feed`; secretos quedan server-side.

## Eventos DOM
Emitidos sobre el mount del engine:
- `ari-chart:ready`
- `ari-chart:interval`
- `ari-chart:data`
- `ari-chart:error`
- `ari-chart:drawings-change`
- `ari-chart:favorites-change`
- `ari-chart:price-alerts-change`
- `ari-chart:price-alert-triggered`

Esta superficie permite que una futura capa GPT cree/modifique dibujos y alertas directamente sobre objetos precio/tiempo, sin manipular coordenadas de pantalla.