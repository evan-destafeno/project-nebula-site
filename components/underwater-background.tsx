/**
 * Underwater Background — Project Nebula
 *
 * Always-rendered fixed layer that sits behind the page surface. A click pulse
 * (driven by OceanEffects) animates a clip-path circle that reveals this scene
 * through a hole in the warm-charcoal page.
 *
 * Composition (back to front):
 *   1. Water-column bands (no smooth gradient: 4 stepped horizontal blocks).
 *   2. Distant fish school, drifting.
 *   3. Far horizon cliffs.
 *   4. Sub-Epsilon submarine, cruising.
 *   5. Mid coral/rock pillars.
 *   6. Foreground ocean floor + dense coral + kelp.
 *   7. Rising bubble streams.
 *
 * Everything is flat silhouette, no detail. Colors live as transient CSS
 * variables on the root element; they are NOT registered design tokens.
 */
export function UnderwaterBackground() {
  return (
    <div className="underwater-background" aria-hidden="true">
      <svg
        className="underwater-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Water column: 4 stepped bands, no smooth gradient ─────── */}
        <rect x="0" y="0" width="1600" height="240" fill="var(--uw-1)" />
        <rect x="0" y="240" width="1600" height="220" fill="var(--uw-2)" />
        <rect x="0" y="460" width="1600" height="240" fill="var(--uw-3)" />
        <rect x="0" y="700" width="1600" height="300" fill="var(--uw-4)" />

        {/* ── Distant fish schools (drift slowly) ───────────────────
            Each school sits in a base-position <g>, wrapped in an outer
            drifter <g> that the CSS animation translates. Inline transforms
            and CSS transforms stay on separate elements so neither clobbers
            the other. */}
        <g className="uw-school-far" fill="var(--uw-silhouette-far)">
          <g
            className="uw-school-drift"
            style={{ animationDuration: "38s", animationDelay: "0s" }}
          >
            <g transform="translate(120 130)">
              {[
                [0, 0],
                [14, -3],
                [28, 1],
                [40, -5],
                [52, 2],
                [64, -2],
                [22, 8],
                [36, 11],
                [48, 14],
                [10, 14],
              ].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx="3.5" ry="1.4" />
              ))}
            </g>
          </g>
          <g
            className="uw-school-drift"
            style={{ animationDuration: "52s", animationDelay: "-14s" }}
          >
            <g transform="translate(880 95)">
              {[
                [0, 0],
                [10, 4],
                [22, -2],
                [34, 3],
                [46, -1],
                [58, 4],
                [70, 1],
                [82, -3],
                [12, 12],
                [26, 14],
                [38, 11],
                [50, 13],
                [62, 16],
              ].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx="3" ry="1.2" />
              ))}
            </g>
          </g>
          <g
            className="uw-school-drift"
            style={{ animationDuration: "44s", animationDelay: "-22s" }}
          >
            <g transform="translate(1280 200)">
              {[
                [0, 0],
                [12, -4],
                [24, 2],
                [36, -1],
                [48, 5],
                [60, 0],
                [16, 10],
                [30, 13],
                [42, 9],
              ].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.1" />
              ))}
            </g>
          </g>
        </g>

        {/* ── Far horizon cliffs (lighter silhouette, ~50% opacity) ── */}
        <path
          fill="var(--uw-silhouette-mid)"
          d="M 0 460
             L 0 600
             L 90 590 L 160 555 L 230 595 L 320 540 L 400 580
             L 490 525 L 580 575 L 680 530 L 790 570 L 900 510
             L 1010 555 L 1120 525 L 1240 575 L 1340 540 L 1450 580
             L 1540 555 L 1600 575
             L 1600 700 L 0 700 Z"
        />

        {/* ── Mid distance: kelp grove (lighter silhouette) ─────────── */}
        <g
          className="uw-kelp-far"
          fill="var(--uw-silhouette-mid)"
          opacity="0.65"
        >
          {[140, 320, 510, 720, 980, 1180, 1410].map((x, i) => (
            <path
              key={i}
              d={`M ${x} 700 Q ${x - 8} 620 ${x + 4} 540 Q ${x + 14} 460 ${x + 6} 380 L ${x + 12} 700 Z`}
            />
          ))}
        </g>

        {/* ── Sub-Epsilon cruising mid-water ──────────────────────────── */}
        <g className="uw-sub-epsilon-drift">
          <g className="uw-sub-epsilon" fill="var(--uw-silhouette)">
            {/* Hull: torpedo body */}
            <path d="M -55 0 Q -45 -16 -10 -19 L 110 -19 Q 145 -17 158 -10 Q 168 0 158 10 Q 145 17 110 19 L -10 19 Q -45 16 -55 0 Z" />
            {/* Conning tower */}
            <rect x="20" y="-32" width="44" height="14" rx="2" />
            <rect x="34" y="-37" width="16" height="6" rx="1" />
            {/* Forward fin */}
            <path d="M -10 -19 L -22 -34 L -2 -22 Z" />
            <path d="M -10 19 L -22 34 L -2 22 Z" />
            {/* Tail fins */}
            <path d="M 130 -19 L 152 -36 L 156 -19 Z" />
            <path d="M 130 19 L 152 36 L 156 19 Z" />
            {/* Propeller hub */}
            <circle cx="162" cy="0" r="4" />
            {/* Antenna */}
            <line
              x1="42"
              y1="-37"
              x2="42"
              y2="-50"
              stroke="var(--uw-silhouette)"
              strokeWidth="1.5"
            />
          </g>
        </g>

        {/* ── Mid foreground coral pillars ──────────────────────────── */}
        <g fill="var(--uw-silhouette-near)">
          {/* Tall thin coral cluster left */}
          <path d="M 80 850 L 70 700 L 78 720 L 64 670 L 76 690 L 68 640 L 84 660 L 80 600 L 92 660 L 100 700 L 106 850 Z" />
          {/* Sea fan left */}
          <path d="M 180 850 Q 175 770 165 740 Q 155 700 168 680 L 172 720 L 178 690 L 184 720 L 190 685 L 196 720 L 202 690 L 208 730 Q 218 760 212 850 Z" />
          {/* Coral tower middle-left */}
          <path d="M 380 850 L 370 720 L 378 740 L 365 690 L 376 705 L 370 660 L 384 680 L 388 720 L 396 700 L 392 740 L 402 850 Z" />
          {/* Wide reef middle */}
          <path d="M 580 850 Q 570 800 560 770 L 576 790 L 564 740 L 582 765 L 590 720 L 600 760 L 608 730 L 616 770 L 626 740 L 632 780 L 644 750 L 648 800 Q 660 820 656 850 Z" />
          {/* Sea fan middle-right */}
          <path d="M 1020 850 Q 1015 760 1000 720 L 1010 745 L 1006 700 L 1018 730 L 1026 700 L 1034 740 L 1042 705 L 1050 740 L 1054 770 Q 1064 810 1060 850 Z" />
          {/* Coral tower right */}
          <path d="M 1220 850 L 1208 700 L 1216 720 L 1204 670 L 1214 690 L 1206 640 L 1224 660 L 1228 700 L 1238 680 L 1232 720 L 1244 850 Z" />
          {/* Tall fan far right */}
          <path d="M 1430 850 Q 1420 740 1408 700 L 1416 730 L 1410 680 L 1424 710 L 1430 670 L 1442 710 L 1448 680 L 1456 720 L 1462 700 L 1466 740 Q 1474 800 1466 850 Z" />
        </g>

        {/* ── Foreground ocean floor (dark silhouette, undulating) ──── */}
        <path
          fill="var(--uw-silhouette)"
          d="M 0 870
             C 60 866 110 880 170 872
             C 230 862 290 884 360 876
             C 430 868 490 890 560 880
             C 630 870 690 894 760 884
             C 830 874 890 896 960 886
             C 1030 876 1090 898 1160 888
             C 1230 878 1290 902 1360 890
             C 1430 880 1490 902 1560 892
             L 1600 890 L 1600 1000 L 0 1000 Z"
        />

        {/* ── Foreground swaying kelp ──────────────────────────────── */}
        <g className="uw-kelp-near" fill="var(--uw-silhouette)">
          {[60, 235, 415, 540, 680, 815, 940, 1100, 1265, 1380, 1500].map(
            (x, i) => (
              <g
                key={i}
                style={{ animationDelay: `${(i % 5) * 0.6 - 1.5}s` }}
                className="uw-kelp-blade"
              >
                <path
                  d={`
                    M ${x - 3} 880
                    Q ${x - 8} 800 ${x + 2} 740
                    Q ${x + 12} 670 ${x + 4} 600
                    Q ${x - 6} 540 ${x + 6} 480
                    L ${x + 10} 480
                    Q ${x + 2} 540 ${x + 12} 600
                    Q ${x + 20} 670 ${x + 10} 740
                    Q ${x} 800 ${x + 5} 880 Z
                  `}
                />
              </g>
            ),
          )}
        </g>

        {/* ── Bubble streams ───────────────────────────────────────── */}
        <g className="uw-bubbles" fill="var(--uw-bubble)">
          {Array.from({ length: 36 }).map((_, i) => {
            const cols = [120, 305, 540, 760, 990, 1240, 1470];
            const colX = cols[i % cols.length];
            const jitter = ((i * 37) % 30) - 15;
            const x = colX + jitter;
            const r = 1.5 + ((i * 13) % 7) * 0.4;
            const dur = 7 + ((i * 17) % 9);
            const delay = ((i * 29) % 100) / 10;
            return (
              <circle
                key={i}
                cx={x}
                cy={1000}
                r={r}
                style={{
                  animation: `uw-bubble-rise ${dur}s linear -${delay}s infinite`,
                  opacity: 0.55,
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
