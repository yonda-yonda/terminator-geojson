import { Feature, Polygon } from "geojson";

const getJulianDate = (date: Date | number): number => {
    // https://www5d.biglobe.ne.jp/~noocyte/Programming/GregorianAndJulianCalendars.html
    const d = date instanceof Date ? date.getTime() : date;
    return d / 86400000 + 2440587.5;
}

const getGreenwichMeanSiderealTime = (jd: number): number => {
    // https://aa.usno.navy.mil/faq/GAST
    return (18.697374558 + 24.06570982441908 * (jd - 2451545)) % 24;
}

const getSunEclipticLongitude = (jd: number): number => {
    // https://en.wikipedia.org/wiki/Position_of_the_Sun
    const n = jd - 2451545;
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;

    // radians
    return (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI / 180;
}

const getEclipticObliquity = (jd: number): number => {
    // https://ja.wikipedia.org/wiki/%E9%BB%84%E9%81%93%E5%82%BE%E6%96%9C%E8%A7%92
    const t = (jd - 2451545) / 36525;

    // radians
    return ((84381.406 - 46.836769 * t - 0.00059 * t ** 2 + 0.001813 * t ** 3) / 3600) * Math.PI / 180;
}

const getSunEquatorialPosition = (longitude: number, obliquity: number): number[] => {
    // 日の出・日の入りの計算 天体の出没時刻の求め方 長沢工著 ISBN4-8052-0634-9
    let alpha =
        Math.atan(Math.tan(longitude) * Math.cos(obliquity));
    const delta =
        Math.asin(Math.sin(longitude) * Math.sin(obliquity));

    if (Math.sin(longitude) > 0) {
        if (Math.sin(alpha) < 0) alpha += Math.PI
    } else {
        if (0 < Math.sin(alpha)) alpha += Math.PI
    }

    // radians
    return [alpha, delta];
}

const getLatitude = (longitude: number, alpha: number, delta: number, gmst: number): number => {
    // 日の出・日の入りの計算 天体の出没時刻の求め方 長沢工著 ISBN4-8052-0634-9
    // 太陽高度kを0に固定
    const hourAngle = (gmst * 15 * Math.PI / 180 + longitude) - alpha;
    // radians
    return Math.atan(-Math.cos(hourAngle) / Math.tan(delta));
}

export const calculate = (options?: { date?: Date; division?: number }): Feature<Polygon> => {
    const { date, division } = Object.assign({ date: new Date(), division: 360 }, options);

    const jd = getJulianDate(date);
    const gmst = getGreenwichMeanSiderealTime(jd);

    const sunEclipticLongitude = getSunEclipticLongitude(jd);
    const eclipticObliquity = getEclipticObliquity(jd);
    const [alpha, delta] = getSunEquatorialPosition(sunEclipticLongitude, eclipticObliquity);

    const longlats: number[][] = [];
    const diffDeg = 360 / division;
    for (let longitude = -180; longitude < 180; longitude += diffDeg) {
        const latitude = getLatitude(longitude * Math.PI / 180, alpha, delta, gmst);
        longlats.push([longitude, latitude * 180 / Math.PI]);
    }
    const latitude = getLatitude(Math.PI, alpha, delta, gmst);
    longlats.push([180, latitude * 180 / Math.PI]);

    if (delta > 0) {
        longlats.push([180, -90]);
        longlats.push([-180, -90]);
        longlats.push(longlats[0]);
        longlats.reverse(); // right-hand rule
    } else {
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
    }
}