# Facts to verify

Every field below was set to `null` because I was not highly confident in the figure. The app shows these as "—". Before you fill one in, check it against at least two reliable sources (manufacturer data, museum catalogues, official military publications).

Conventions: `weightKg` is the empty weight without a magazine; `lengthMm` is overall length (stock extended where adjustable); `capacity` is the standard magazine or cylinder.

| id | name | null fields |
|---|---|---|
| galil | IMI Galil | weightKg, lengthMm |
| scar-l | FN SCAR-L | lengthMm |
| hk416 | Heckler & Koch HK416 | weightKg, lengthMm |
| scar-h | FN SCAR-H | lengthMm |
| steyr-ssg-69 | Steyr SSG 69 | weightKg, lengthMm |
| m40 | M40 | weightKg, lengthMm |
| l96a1 | Accuracy International L96A1 | weightKg, lengthMm |
| mk14-ebr | Mk 14 Enhanced Battle Rifle | weightKg, lengthMm |
| thompson | Thompson submachine gun | lengthMm |
| m3-grease-gun | M3 submachine gun | lengthMm |
| mac-10 | MAC-10 | lengthMm |
| hk-ump | Heckler & Koch UMP | lengthMm |
| hk-mp7 | Heckler & Koch MP7 | lengthMm, capacity |
| kriss-vector | KRISS Vector | year, weightKg, lengthMm, capacity |
| bar-m1918 | Browning Automatic Rifle | weightKg, lengthMm |
| bren | Bren gun | weightKg |
| winchester-1887 | Winchester Model 1887 | weightKg, lengthMm, capacity |
| winchester-1897 | Winchester Model 1897 | weightKg, lengthMm, capacity |
| ithaca-37 | Ithaca 37 | weightKg, lengthMm, capacity |
| remington-870 | Remington 870 | weightKg, lengthMm, capacity |
| mossberg-500 | Mossberg 500 | weightKg, lengthMm, capacity |
| spas-12 | Franchi SPAS-12 | capacity |
| saiga-12 | Saiga-12 | year, weightKg, lengthMm, capacity |
| benelli-m4 | Benelli M4 | capacity |
| hk-usp | Heckler & Koch USP | weightKg, lengthMm, capacity |
| colt-saa | Colt Single Action Army | weightKg, lengthMm |
| colt-python | Colt Python | weightKg, lengthMm |
| winchester-1873 | Winchester Model 1873 | weightKg, lengthMm, capacity |
| mosin-nagant | Mosin–Nagant | weightKg, lengthMm |

## Notes

- Belt-fed machine guns (mg-34, mg-42, m60, fn-mag, pkm) have `capacity: null` on purpose, because a belt has no fixed capacity. They are not uncertain.
- `nickname` and `designer` are null where there is no widely used nickname or no single credited designer.
- Figures with several common variants: m16 uses M16A1 figures; m4-carbine length is with the stock extended; galil capacity uses the standard 35-round magazine; hk-ump calibre and capacity use the .45 ACP version; l115a3 year is the British Army adoption year.
- Worth a second check even though filled in: walther-p38 (adoption year 1938).
