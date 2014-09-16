/**
 * @author Drew Noakes https://drewnoakes.com
 * @date 22 Jan 2014
 */

import biggus = require("lib/biggus-griddus/biggus");

//
// Domain model
//

enum Side
{
    Buy = 0,
    Sell = 1
}

interface IInstrument
{
    ric: string;
    iso2: string;
}

interface ITrade extends biggus.INotifyChange<ITrade>
{
    id: number;
    instrument: IInstrument;
    side: Side;
    status: string;
    quantity: number;
    filled: number;
}

var instruments = [
    {ric: 'VOD LN', iso2: 'GB'},
    {ric: 'IBM US', iso2: 'US'},
    {ric: 'RIO AU', iso2: 'AU'},
    {ric: 'BER DE', iso2: 'DE'},
    {ric: 'PHIL NL', iso2: 'NL'},
    {ric: 'CURR IN', iso2: 'IN'}
];

var tradeStatuses = ["unsent", "new", "rejected", "cancelled", "partial", "filled"];

//
// Grid construction
//

var columns: biggus.IColumn<ITrade>[] = [
    new biggus.TextColumn<ITrade>({title: 'ID', path: 'id', className: 'centered'}),
    new biggus.ImageColumn<ITrade>({url: "img/flags/{instrument.iso2}.png", lowerCase: true, className: "flag"}),
    new biggus.TextColumn<ITrade>({title: "Instrument", path: "instrument.ric"}),
    new biggus.TextColumn<ITrade>({title: "Status", path: "status"}),
    new biggus.TextColumn<ITrade>({
        title: "Side",
        className: "side",
        value: trade => trade.side === Side.Buy ? "BUY" : "SELL",
        tdStyle: (td, trade) => td.classList.add(trade.side === Side.Buy ? "buy" : "sell")
    }),
    new biggus.NumericColumn<ITrade>({title: "Quantity", path: "quantity", className: "numeric"}),
    new biggus.NumericColumn<ITrade>({title: "Filled", path: "filled", className: "numeric", hideZero: true}),
    new biggus.BarChartColumn<ITrade>({
        title: "% Filled",
        className: "fill-percent",
        ratio: trade => trade.filled / trade.quantity,
        color: ratio => "hsl(" + (360 * ratio) + ",100%,50%)"
    }),
    new biggus.ActionColumn<ITrade>({
        title: "",
        text: "cancel",
        type: biggus.ActionPresentationType.Button,
        action: trade => alert("Cancelling trade " + trade.id)
    }),
    new biggus.ActionColumn<ITrade>({
        title: "",
        text: "update",
        type: biggus.ActionPresentationType.Button,
        action: trade => update(trade)
    })
];

var table = <HTMLTableElement>document.querySelector('table');

var source = new biggus.DataSource<ITrade>(trade => trade.id.toString());

var grid = new biggus.Grid<ITrade>(source, table, {
    columns: columns,
    rowClassName: trade => "order-" + trade.status
});

var nextId = 1;
function add(count: number)
{
    for (var t = 1; t <= count; t++)
    {
        var instrument = instruments[Math.floor(Math.random() * instruments.length)];
        var trade: ITrade = <any>{
            id: nextId++,
            instrument: instrument,
            side: Math.random() > 0.5 ? Side.Buy : Side.Sell,
            status: 'new',
            quantity: Math.round(Math.random() * 1000 + 100),
            filled: 0
        };
        biggus.mixinNotifyChange(trade);
        source.add(trade);
    }
}

//
// Random mutation of data
//

function update(trade?: ITrade)
{
    if (!trade)
    {
        var trades = source.getAllItems();
        if (!trades.length)
            return;
        trade = trades[Math.floor(Math.random() * trades.length)];
    }

    trade.filled = Math.floor((trade.filled + Math.random() * 100) % trade.quantity);
    trade.status = tradeStatuses[Math.floor(Math.random() * tradeStatuses.length)];
    trade.notifyChange();
}

var updatePeriodMillis = 5,
    chkUpdate = <HTMLInputElement>document.querySelector('#chk-update');

//
// Periodically change data at random
//

setInterval(() =>
{
    if (!chkUpdate.checked)
        return;
    update();
}, updatePeriodMillis);

//
// Bind UI
//

document.querySelector('#btn-update').addEventListener('click', () => update());
document.querySelector('#btn-reset').addEventListener('click', () => source.reset());
document.querySelector('#btn-clear').addEventListener('click', () => source.clear());
document.querySelector('#btn-add-1').addEventListener('click', () => add(1));
document.querySelector('#btn-add-10').addEventListener('click', () => add(10));
document.querySelector('#btn-add-1000').addEventListener('click', () => add(1000));

var numWindowSize = <HTMLInputElement>document.querySelector('#num-window-size'),
    numWindowOffset = <HTMLInputElement>document.querySelector('#num-window-offset');

numWindowSize.addEventListener('input', e => grid.setWindowSize(parseInt(numWindowSize.value)));
numWindowOffset.addEventListener('input', e => grid.setWindowOffset(parseInt(numWindowOffset.value)));
