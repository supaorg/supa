import type { CustomThemeConfig } from "@skeletonlabs/tw-plugin";

export const supamindTheme: CustomThemeConfig = {
  name: "supamindTheme",
  properties: {
    // =~= Theme Properties =~=
    "--theme-font-family-base": `system-ui`,
    "--theme-font-family-heading": `system-ui`,
    "--theme-font-color-base": "0 0 0",
    "--theme-font-color-dark": "255 255 255",
    "--theme-rounded-base": "9999px",
    "--theme-rounded-container": "4px",
    "--theme-border-base": "1px",
    // =~= Theme On-X Colors =~=
    "--on-primary": "0 0 0",
    "--on-secondary": "0 0 0",
    "--on-tertiary": "0 0 0",
    "--on-success": "255 255 255",
    "--on-warning": "0 0 0",
    "--on-error": "0 0 0",
    "--on-surface": "255 255 255",
    // =~= Theme Colors  =~=
    // primary | #e0d93b
    "--color-primary-50": "250 249 226", // #faf9e2
    "--color-primary-100": "249 247 216", // #f9f7d8
    "--color-primary-200": "247 246 206", // #f7f6ce
    "--color-primary-300": "243 240 177", // #f3f0b1
    "--color-primary-400": "233 228 118", // #e9e476
    "--color-primary-500": "224 217 59", // #e0d93b
    "--color-primary-600": "202 195 53", // #cac335
    "--color-primary-700": "168 163 44", // #a8a32c
    "--color-primary-800": "134 130 35", // #868223
    "--color-primary-900": "110 106 29", // #6e6a1d
    // secondary | #1fdcfd
    "--color-secondary-50": "221 250 255", // #ddfaff
    "--color-secondary-100": "210 248 255", // #d2f8ff
    "--color-secondary-200": "199 246 255", // #c7f6ff
    "--color-secondary-300": "165 241 254", // #a5f1fe
    "--color-secondary-400": "98 231 254", // #62e7fe
    "--color-secondary-500": "31 220 253", // #1fdcfd
    "--color-secondary-600": "28 198 228", // #1cc6e4
    "--color-secondary-700": "23 165 190", // #17a5be
    "--color-secondary-800": "19 132 152", // #138498
    "--color-secondary-900": "15 108 124", // #0f6c7c
    // tertiary | #729790
    "--color-tertiary-50": "234 239 238", // #eaefee
    "--color-tertiary-100": "227 234 233", // #e3eae9
    "--color-tertiary-200": "220 229 227", // #dce5e3
    "--color-tertiary-300": "199 213 211", // #c7d5d3
    "--color-tertiary-400": "156 182 177", // #9cb6b1
    "--color-tertiary-500": "114 151 144", // #729790
    "--color-tertiary-600": "103 136 130", // #678882
    "--color-tertiary-700": "86 113 108", // #56716c
    "--color-tertiary-800": "68 91 86", // #445b56
    "--color-tertiary-900": "56 74 71", // #384a47
    // success | #107e60
    "--color-success-50": "219 236 231", // #dbece7
    "--color-success-100": "207 229 223", // #cfe5df
    "--color-success-200": "195 223 215", // #c3dfd7
    "--color-success-300": "159 203 191", // #9fcbbf
    "--color-success-400": "88 165 144", // #58a590
    "--color-success-500": "16 126 96", // #107e60
    "--color-success-600": "14 113 86", // #0e7156
    "--color-success-700": "12 95 72", // #0c5f48
    "--color-success-800": "10 76 58", // #0a4c3a
    "--color-success-900": "8 62 47", // #083e2f
    // warning | #e5a5fc
    "--color-warning-50": "251 242 255", // #fbf2ff
    "--color-warning-100": "250 237 254", // #faedfe
    "--color-warning-200": "249 233 254", // #f9e9fe
    "--color-warning-300": "245 219 254", // #f5dbfe
    "--color-warning-400": "237 192 253", // #edc0fd
    "--color-warning-500": "229 165 252", // #e5a5fc
    "--color-warning-600": "206 149 227", // #ce95e3
    "--color-warning-700": "172 124 189", // #ac7cbd
    "--color-warning-800": "137 99 151", // #896397
    "--color-warning-900": "112 81 123", // #70517b
    // error | #4d8b17
    "--color-error-50": "228 238 220", // #e4eedc
    "--color-error-100": "219 232 209", // #dbe8d1
    "--color-error-200": "211 226 197", // #d3e2c5
    "--color-error-300": "184 209 162", // #b8d1a2
    "--color-error-400": "130 174 93", // #82ae5d
    "--color-error-500": "77 139 23", // #4d8b17
    "--color-error-600": "69 125 21", // #457d15
    "--color-error-700": "58 104 17", // #3a6811
    "--color-error-800": "46 83 14", // #2e530e
    "--color-error-900": "38 68 11", // #26440b
    // surface | #455a8f
    "--color-surface-50": "227 230 238", // #e3e6ee
    "--color-surface-100": "218 222 233", // #dadee9
    "--color-surface-200": "209 214 227", // #d1d6e3
    "--color-surface-300": "181 189 210", // #b5bdd2
    "--color-surface-400": "125 140 177", // #7d8cb1
    "--color-surface-500": "69 90 143", // #455a8f
    "--color-surface-600": "62 81 129", // #3e5181
    "--color-surface-700": "52 68 107", // #34446b
    "--color-surface-800": "41 54 86", // #293656
    "--color-surface-900": "34 44 70", // #222c46
  },
};
