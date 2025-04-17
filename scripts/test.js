function Ya(a) {
    var b = Wa[a];
    if (!b || b.length === 0)
        return "";
    for (var c = [], d = 0, e = 0; e < b.length; e++)
        e % 8 === 0 && e > 0 && (c.push(String.fromCharCode(d)),
        d = 0),
        b[e] && (d |= 1 << e % 8);
    d > 0 && c.push(String.fromCharCode(d));
    return Ua(c.join("")).replace(/\.+$/, "")
}

var XK = function(a) {
    var b = U(a, "event_usage");
    if (Array.isArray(b))
        for (var c = 0; c < b.length; c++)
            WK(b[c]);
    var d = Ya("GA4_EVENT");
    d && W(a, "_eu", d)
}