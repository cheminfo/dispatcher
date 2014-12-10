function formatTime(time, format) {
    if (format) {
        if (format === 'ms') {
            return time + 'ms';
        }
        if (format === 's') {
            return (time / 1000) + 's';
        }
    }
    else
        return time;
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
            this._start = Date.now() - this._elapsed;
            this._paused = false;
        } else if (!this._started) {
            this._start = Date.now();
            this._started = true;
        }
    },
    pause: function () {
        if (this._started && !this._paused) {
            this._paused = true;
            this._elapsed = Date.now() - this._start;
        }
    },
    time: function (format) {
        if (this._started && !this._paused) {
            return formatTime(Date.now() - this._start, format);
        }
    },
    step: function (format) {
        if (this._started && !this._paused) {
            var now = Date.now();
            var time = now - this._start;
            this._start = now;
            this._total += time;
            this._steps.push(time);
            return formatTime(time, format);
        }
    },
    lap: function (format) {
        if (this._started && !this._paused) {
            var time = Date.now() - this._start;
            this._laps.push(time);
            return formatTime(this._total, format);
        }
    },
    sum: function (name) {
        var elapsed = Date.now() - this._start;
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