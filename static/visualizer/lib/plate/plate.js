define(['lodash', 'src/util/obs', 'chroma'],function(_, Observable, chroma) {
    function Plate(domId, options) {
        this._id = domId;
        this.options = options || {};
        this._init();
    }

    function getMinMax(data, t) {
        var values = _(data).flatten().filter(function(val) {
            return val.t === t;
        }).pluck('v').value();
        var minValue = Math.min.apply(null, values);
        var maxValue = Math.max.apply(null, values);
        return [minValue, maxValue];
    }

    function getDataByType(data, t) {
        return _(data.flatten().filter(function(val) {
            return val.t === t;
        }))
    }

    _.extend(Plate.prototype, Observable.prototype);

    _.extend(Plate.prototype, {
        _init: function() {
            console.log('init plate');

            var $container = $('#'+this._id);
            if(!$container.length) return;

            var data = this.options.data;
            var nbLines = data.length;
            var nbColumns = data[0] ? data[0].length : null;

            var intensities = getMinMax(data, );



            var itemHeight = (100/nbColumns).toString() + '%';
            var itemWidth = (100/nbLines).toString() + '%';

            var html = '<table>';
            var positiv = chroma('red');
            var negativ = chroma('green');
            var sample = chroma('blue');
            var other = chroma('gray');

            var positivScale = chroma.scale(['#001A66', '#CCD6F5']).domain(getDataByType(data, 1), 9);
            var negativScale = chroma.scale(['#FFCCCC', '#990000']).domain(getDataByType(data, 0), 9);
            var sampleScale = chroma.scale(['#001A66', '#CCD6F5']).domain(getDataByType(data, 2), 9);

            for(var line=0; line<nbLines; line++) {
                html += '<tr>';
                for(var column=0; column<nbColumns; column++) {
                    html += '<td>';
                    var $item = '<rect/>';
                    var color;
                    switch(data[line][column].t) {
                        case 0:
                            color = negativ;
                            break;
                        case 1:
                            color = positiv;
                            break;
                        case 2:
                            color = sample;
                            break;
                        default:
                            color = other;
                            break;
                    }

                    $item.attr({
                        width: itemWidth,
                        height: itemHeight,
                        backgroundColor: color
                    });

                    html += '</td>';
                }
                html += '</tr>';
            }

            html += '</table>';

            $container.append(html);
        }
    });

    return Plate;
});