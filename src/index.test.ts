import { calculate, NoConvergenceError } from "./index"

it("division", () => {
    expect(calculate().geometry.coordinates[0].length).toEqual(
        360 + 4);
    expect(calculate({ division: 180 }).geometry.coordinates[0].length).toEqual(
        180 + 4);
});
it("date", () => {
    const d = new Date("2023-01-01:00:00:00Z");
    expect(calculate({ date: d }).properties?.datetime).toEqual(
        d.toISOString());
});


it("error", () => {
    expect(() => calculate({ elevationDegree: -90 })).toThrow(RangeError);
    expect(() => calculate({ date: new Date("2023-01-01:00:00:00Z"), elevationDegree: -25 })).toThrow(NoConvergenceError);
});
