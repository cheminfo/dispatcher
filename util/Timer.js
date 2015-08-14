var perfNow = require('performance-now');

function formatTime(time, unit, precision) {
    precision = precision || 0;
    unit = unit || 'Ms';
    if (unit) {
        if (unit === 'ms') {
            return (time * 1000).toFixed(precision) + '\u00B5s';
        }
        if (unit === 'Ms') {
            return time.toFixed(precision) + 'ms';
        }
        if (unit === 's') {
            return (time / 1000).toFixed(precision) + 's';
        }
    }
}

function Timer() {
    this._started = false;
    this._paused = false;
    this._steps = [];
    this._laps = [];
    this._sumElapsed = 0;
    this._sums = {};
}

Timer.prototype = {
    start: function () {
        if (this._paused) {
            this._start = perfNow() - this._elapsed;
            this._paused = false;
        } else if (!this._started) {
            this._start = perfNow();
            this._started = true;
        }
    },
    pause: function () {
        if (this._started && !this._paused) {
            this._paused = true;
            this._elapsed = perfNow() - this._start;
        }
    },
    time: function (format) {
        if (this._started && !this._paused) {
            return formatTime(perfNow() - this._start, format);
        }
    },
    step: function (format) {
        if (this._started && !this._paused) {
            var now = perfNow();
            var time = now - this._start;
            this._start = now;
            this._total += time;
            this._steps.push(time);
            return formatTime(time, format);
        }
    },
    lap: function (format) {
        if (this._started && !this._paused) {
            var time = perfNow() - this._start;
            this._laps.push(time);
            return formatTime(this._total, format);
        }
    },
    sum: function (name) {
        var elapsed = perfNow() - this._start;
        if (name) {
            if (!this._sums[name]) {
                this._sums[name] = 0;
            }
            this._sums[name] += elapsed - this._sumElapsed;
        }
        this._sumElapsed = elapsed;
    },
    getSteps: function (format) {
        return this._steps.map(function (time) {
            return formatTime(time, format);
        });
    },
    getLaps: function (format) {
        return this._laps.map(function (time) {
            return formatTime(time, format);
        });
    },
    getSums: function (format) {
        var result = {};
        for (var i in this._sums) {
            result[i] = formatTime(this._sums[i], format);
        }
        return result;
    }
};

exports = module.exports = Timer;