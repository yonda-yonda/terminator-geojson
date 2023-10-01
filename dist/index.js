"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate = exports.NoConvergenceError = void 0;
class NoConvergenceError extends Error {
    constructor(message) {
        super(message);
        this.name = "NoConvergenceError";
    }
}
exports.NoConvergenceError = NoConvergenceError;
const getJulianDate = (date) => {
    // https://www5d.biglobe.ne.jp/~noocyte/Programming/GregorianAndJulianCalendars.html
    const d = date instanceof Date ? date.getTime() : date;
    return d / 86400000 + 2440587.5;
};
const getGreenwichMeanSiderealTime = (jd) => {
    // https://aa.usno.navy.mil/faq/GAST
    return (18.697374558 + 24.06570982441908 * (jd - 2451545)) % 24;
};
const getSunEclipticLongitude = (jd) => {
    // https://en.wikipedia.org/wiki/Position_of_the_Sun
    const n = jd - 2451545;
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
    // radians
    return (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI / 180;
};
const getEclipticObliquity = (jd) => {
    // https://ja.wikipedia.org/wiki/%E9%BB%84%E9%81%93%E5%82%BE%E6%96%9C%E8%A7%92
    const t = (jd - 2451545) / 36525;
    // radians
    return ((84381.406 - 46.836769 * t - 0.00059 * t ** 2 + 0.001813 * t ** 3) / 3600) * Math.PI / 180;
};
const getSunEquatorialPosition = (longitude, obliquity) => {
    // 日の出・日の入りの計算 天体の出没時刻の求め方 長沢工著 ISBN4-8052-0634-9
    let alpha = Math.atan(Math.tan(longitude) * Math.cos(obliquity));
    const delta = Math.asin(Math.sin(longitude) * Math.sin(obliquity));
    if (Math.sin(longitude) > 0) {
        if (Math.sin(alpha) < 0)
            alpha += Math.PI;
    }
    else {
        if (0 < Math.sin(alpha))
            alpha += Math.PI;
    }
    // radians
    return [alpha, delta];
};
const falsePositionMethod = (f, edges, options) => {
    const { eps, maxIter } = Object.assign({ eps: 1e-10, maxIter: 1000 }, options);
    let c = edges[0];
    let count = 0;
    let a = Math.min(...edges);
    let b = Math.max(...edges);
    while (count++ < maxIter) {
        const fa = f(a);
        const fb = f(b);
        c = (a * fb - b * fa) / (fb - fa);
        const fc = f(c);
        if (Math.abs(fc) < eps)
            break;
        if (fa * fc < 0) {
            b = c;
        }
        if (fa * fc > 0) {
            a = c;
        }
    }
    if (count >= maxIter)
        throw new NoConvergenceError();
    return c;
};
const getLatitude = (longitude, alpha, delta, gmst, elevation, options) => {
    // 日の出・日の入りの計算 天体の出没時刻の求め方 長沢工著 ISBN4-8052-0634-9
    // 太陽高度kを0に固定
    const hourAngle = (gmst * 15 * Math.PI / 180 + longitude) - alpha;
    if (elevation === 0) {
        // radians
        return Math.atan(-Math.cos(hourAngle) / Math.tan(delta));
    }
    const lat = falsePositionMethod((x) => {
        return Math.sin(delta) * Math.sin(x) + Math.cos(delta) * Math.cos(x) * Math.cos(hourAngle) - Math.sin(elevation);
    }, [-Math.PI / 2, Math.PI / 2], options);
    if (lat < -Math.PI / 2)
        return -Math.PI / 2;
    if (Math.PI / 2 < lat)
        return Math.PI / 2;
    return lat;
};
const getTwilight = (t) => {
    switch (t) {
        case "civil": {
            return -6 * Math.PI / 180;
        }
        case "nautical": {
            return -12 * Math.PI / 180;
        }
        case "astronomical": {
            return -18 * Math.PI / 180;
        }
        default: {
            return 0;
        }
    }
};
const calculate = (options) => {
    const { date, division, elevationDegree } = Object.assign({ date: new Date(), division: 360, elevationDegree: 0 }, options);
    const elevation = typeof elevationDegree === "string" ? getTwilight(elevationDegree) :
        elevationDegree * Math.PI / 180;
    if (Math.PI / 4 < Math.abs(elevation))
        throw new RangeError();
    const jd = getJulianDate(date);
    const gmst = getGreenwichMeanSiderealTime(jd);
    const sunEclipticLongitude = getSunEclipticLongitude(jd);
    const eclipticObliquity = getEclipticObliquity(jd);
    const [alpha, delta] = getSunEquatorialPosition(sunEclipticLongitude, eclipticObliquity);
    const longlats = [];
    const diffDeg = 360 / division;
    for (let longitude = -180; longitude < 180; longitude += diffDeg) {
        const latitude = getLatitude(longitude * Math.PI / 180, alpha, delta, gmst, elevation);
        longlats.push([longitude, latitude * 180 / Math.PI]);
    }
    const latitude = getLatitude(Math.PI, alpha, delta, gmst, elevation);
    longlats.push([180, latitude * 180 / Math.PI]);
    if (delta > 0) {
        longlats.push([180, -90]);
        longlats.push([-180, -90]);
        longlats.push(longlats[0]);
        longlats.reverse(); // right-hand rule
    }
    else {
        longlats.push([180, 90]);
        longlats.push([-180, 90]);
        longlats.push(longlats[0]);
    }
    return {
        type: "Feature",
        properties: {
            "datetime": date.toISOString()
        },
        geometry: {
            type: "Polygon",
            coordinates: [longlats]
        }
    };
};
exports.calculate = calculate;
