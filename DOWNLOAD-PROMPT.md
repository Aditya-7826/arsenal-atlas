# Master prompt: download the 3D models

Paste everything inside the box into **Claude in Chrome** while you are logged in to Sketchfab. When it finishes, save the JSON log it prints as `data/downloads.json` (or paste it to Claude Code), then run `npm run models:import`, `npm run models:optimize` and `npm run models:check`.

```text
You are helping me collect free, properly licensed 3D models for a museum-style website about historic firearms (an encyclopedia, no gameplay). Work in my Chrome browser on sketchfab.com. I am already logged in to Sketchfab.

GOAL
For each firearm in the list below, find ONE realistic 3D model on Sketchfab, check its licence, and download it as a GLB file to my default Downloads folder.

HOW TO SEARCH
Open: https://sketchfab.com/search?features=downloadable&type=models&q=<firearm name>
Try the full name first, then the short name or nickname if the results are poor.

A MODEL IS ACCEPTABLE ONLY IF ALL OF THESE ARE TRUE
1. The licence box on the model page says "CC0" (Public Domain) or "CC Attribution" (CC BY). Reject anything that says NonCommercial, NoDerivs, ShareAlike, Editorial, Standard, or is a paid Store item.
2. It is free to download (it has a "Download 3D Model" button, not a price).
3. It is the right firearm (the same model, or a very close variant such as the AKM for the AK-47). It shows only the outside: no cutaway, no exploded view, no loose internal parts.
4. It is not ripped from a video game. Reject titles or descriptions that mention Rust, CS:GO, Counter-Strike, PUBG, Call of Duty, Warzone, Tarkov, Battlefield, Fortnite, Roblox, GTA, "ripped" or "extracted". Original models labelled "game-ready" or "game asset" are fine.
5. It is realistic: textured metal, wood or polymer. Not a toy, cartoon, Nerf or airsoft gun, or a blocky low-poly model.
6. No brand logo or trademark as the main feature, no people or hands holding it.
If several qualify, prefer the one with the most likes and views, then 5,000 to 250,000 triangles, then the smaller download.

HOW TO DOWNLOAD
On the model page click "Download 3D Model". In the dialog choose the GLB option (usually listed as "GLB" under "Autoconverted format"). Let it save to Downloads with its default file name. Do NOT rename, unzip or move any file. If no GLB is offered, download the glTF option instead and say so in the log.

RULES
- Never pay, start a trial, buy, sign up for anything, or change account settings.
- If Sketchfab asks me to log in or to solve a CAPTCHA, stop and ask me.
- If no acceptable model exists after checking about 10 results, record the firearm as "none" and move on. Do not lower the standards above.
- Work through the list in order. After every 10 firearms, give me a one-line progress update, then carry on without waiting.

LOG (most important)
Record one entry per firearm. When you finish, or if you have to stop early, output the whole log as one JSON array in a code block, exactly in this format:
[
  {"id": "ak-47", "status": "downloaded", "title": "model title on Sketchfab", "url": "https://sketchfab.com/3d-models/...", "author": "author display name", "authorUrl": "https://sketchfab.com/username", "license": "CC BY 4.0", "file": "exact downloaded file name.glb"},
  {"id": "mg-42", "status": "none"}
]
"id" must be the id from my list (the text before the first "|"). "file" must be the exact file name that appeared in Downloads.

THE LIST (id | name | country, year)
1. ak-47 | AK-47 (Kalashnikov) | Soviet Union, 1949
2. m1-garand | M1 Garand | United States, 1936
3. barrett-m82 | Barrett M82 (Light Fifty) | United States, 1982
4. thompson | Thompson submachine gun (Tommy gun) | United States, 1921
5. mg-42 | MG 42 | Germany, 1942
6. remington-870 | Remington 870 | United States, 1950
7. colt-m1911 | Colt M1911 (Model 1911) | United States, 1911
8. colt-saa | Colt Single Action Army (Peacemaker) | United States, 1873
9. kar98k | Karabiner 98k (Kar98k) | Germany, 1935
10. stg-44 | Sturmgewehr 44 (StG 44) | Germany, 1944
11. akm | AKM (Modernised Kalashnikov) | Soviet Union, 1959
12. ak-74 | AK-74 | Soviet Union, 1974
13. m16 | M16 | United States, 1964
14. m4-carbine | M4 Carbine | United States, 1994
15. hk-g36 | Heckler & Koch G36 | Germany, 1997
16. famas | FAMAS (Le Clairon (The Bugle)) | France, 1978
17. steyr-aug | Steyr AUG | Austria, 1978
19. galil | IMI Galil | Israel, 1972
20. tavor | IWI Tavor TAR-21 (Tavor) | Israel, 2001
21. scar-l | FN SCAR-L (Mk 16) | Belgium, 2009
22. hk416 | Heckler & Koch HK416 | Germany, 2005
25. svt-40 | SVT-40 (Sveta) | Soviet Union, 1940
26. sks | SKS (Simonov) | Soviet Union, 1945
27. fn-fal | FN FAL | Belgium, 1953
29. m14 | M14 | United States, 1959
30. hk-g3 | Heckler & Koch G3 | Germany, 1959
31. scar-h | FN SCAR-H (Mk 17) | Belgium, 2009
32. svd-dragunov | SVD Dragunov (Dragunov) | Soviet Union, 1963
34. steyr-ssg-69 | Steyr SSG 69 | Austria, 1969
35. m40 | M40 | United States, 1966
36. vss-vintorez | VSS Vintorez (Vintorez (Thread cutter)) | Soviet Union, 1987
37. l96a1 | Accuracy International L96A1 | United Kingdom, 1985
38. m24 | M24 Sniper Weapon System (M24) | United States, 1988
40. mk14-ebr | Mk 14 Enhanced Battle Rifle (Mk 14 EBR) | United States, 2004
42. l115a3 | Accuracy International L115A3 (AWM) | United Kingdom, 2008
43. mp40 | MP 40 | Germany, 1940
44. sten | Sten | United Kingdom, 1941
45. ppsh-41 | PPSh-41 (Papasha) | Soviet Union, 1941
46. m3-grease-gun | M3 submachine gun (Grease gun) | United States, 1942
47. uzi | Uzi | Israel, 1954
48. mp5 | Heckler & Koch MP5 | Germany, 1966
49. mac-10 | MAC-10 (M10) | United States, 1970
50. fn-p90 | FN P90 | Belgium, 1990
51. hk-ump | Heckler & Koch UMP | Germany, 1999
52. hk-mp7 | Heckler & Koch MP7 | Germany, 2001
53. kriss-vector | KRISS Vector | United States
54. lewis-gun | Lewis gun | United Kingdom, 1914
55. bar-m1918 | Browning Automatic Rifle (BAR) | United States, 1918
56. mg-34 | MG 34 | Germany, 1936
57. bren | Bren gun | United Kingdom, 1938
58. m60 | M60 (The Pig) | United States, 1957
59. fn-mag | FN MAG (M240 (U.S.)) | Belgium, 1958
60. rpk | RPK | Soviet Union, 1961
61. pkm | PKM | Soviet Union, 1969
62. m249 | M249 SAW (FN Minimi (base design)) | United States, 1984
63. winchester-1887 | Winchester Model 1887 | United States, 1887
64. winchester-1897 | Winchester Model 1897 (Trench gun) | United States, 1897
66. ithaca-37 | Ithaca 37 | United States, 1937
67. mossberg-500 | Mossberg 500 | United States, 1961
69. spas-12 | Franchi SPAS-12 | Italy, 1979
70. saiga-12 | Saiga-12 | Russia
71. benelli-m4 | Benelli M4 (M1014 (U.S.)) | Italy, 1999
72. mauser-c96 | Mauser C96 (Broomhandle) | Germany, 1896
73. luger-p08 | Luger P08 (Parabellum) | Germany, 1908
74. tt-33 | TT-33 Tokarev (TT) | Soviet Union, 1933
75. walther-ppk | Walther PPK | Germany, 1931
76. browning-hi-power | Browning Hi-Power (HP-35) | Belgium, 1935
77. walther-p38 | Walther P38 | Germany, 1938
78. makarov-pm | Makarov PM (PM) | Soviet Union, 1951
79. beretta-92 | Beretta 92 (M9 (U.S.)) | Italy, 1975
81. desert-eagle | Desert Eagle | Israel / United States, 1983
82. sig-p226 | SIG Sauer P226 | Switzerland / Germany, 1984
83. hk-usp | Heckler & Koch USP | Germany, 1993
84. fn-five-seven | FN Five-seveN | Belgium, 2000
85. nagant-m1895 | Nagant M1895 | Russian Empire, 1895
87. webley-mk-vi | Webley Mk VI | United Kingdom, 1915
88. colt-python | Colt Python | United States, 1955
90. winchester-1873 | Winchester Model 1873 (The gun that won the West) | United States, 1873
91. mosin-nagant | Mosin–Nagant | Russian Empire, 1891
92. springfield-m1903 | M1903 Springfield (Springfield) | United States, 1903
93. lee-enfield-smle | Lee–Enfield SMLE Mk III (SMLE) | United Kingdom, 1907
```
