
var gaugeVal = 0;

google.setOnLoadCallback(function () {
  var gauge, gaugeData,
    gaugeOptions = {
      width: 400, height: 200,
      redFrom: 75, redTo: 100,
      yellowFrom: 40, yellowTo: 75,
      minorTicks: 5
    };

  gaugeData = new google.visualization.DataTable();
  gaugeData.addColumn('number', 'Movement');
  gaugeData.addRows(1);

  gauge = new google.visualization.Gauge(document.getElementById('movement-gauge'));

  (function updateGauge() {
    gaugeData.setCell(0, 0, gaugeVal);
    gauge.draw(gaugeData, gaugeOptions);
    //requestAnimationFrame(updateGauge);
    setTimeout(updateGauge, 400);
  }());

});
