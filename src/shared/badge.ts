export function formatBadgeText(rate: number): string {
    const sign = rate < 0 ? "-" : "";
    const abs = Math.abs(rate);
    const to2 = Math.round(abs * 100) / 100;
    let str = String(to2);
    if (str.includes(".")) {
        str = str.replace(/\.0+$/, "").replace(/(\.[0-9])0$/, "$1");
    }
    let withX = `${sign}${str}x`;
    if (withX.length <= 4) return withX;
    const to1 = Math.round(abs * 10) / 10;
    let str1 = String(to1).replace(/\.0$/, "");
    withX = `${sign}${str1}x`;
    if (withX.length <= 4) return withX;
    return `${sign}${Math.round(abs)}`;
}
