import type { CustomThemeConfig } from "@skeletonlabs/tw-plugin";

export const supamindTheme: CustomThemeConfig = {
  name: "supamindTheme",
  properties: {
    // =~= Theme Properties =~=
		"--theme-font-family-base": `system-ui`,
		"--theme-font-family-heading": `system-ui`,
		"--theme-font-color-base": "0 0 0",
		"--theme-font-color-dark": "255 255 255",
		"--theme-rounded-base": "4px",
		"--theme-rounded-container": "4px",
		"--theme-border-base": "1px",
		// =~= Theme On-X Colors =~=
		"--on-primary": "0 0 0",
		"--on-secondary": "0 0 0",
		"--on-tertiary": "0 0 0",
		"--on-success": "0 0 0",
		"--on-warning": "0 0 0",
		"--on-error": "255 255 255",
		"--on-surface": "255 255 255",
		// =~= Theme Colors  =~=
		// primary | #74AA9C 
		"--color-primary-50": "234 242 240", // #eaf2f0
		"--color-primary-100": "227 238 235", // #e3eeeb
		"--color-primary-200": "220 234 230", // #dceae6
		"--color-primary-300": "199 221 215", // #c7ddd7
		"--color-primary-400": "158 196 186", // #9ec4ba
		"--color-primary-500": "116 170 156", // #74AA9C
		"--color-primary-600": "104 153 140", // #68998c
		"--color-primary-700": "87 128 117", // #578075
		"--color-primary-800": "70 102 94", // #46665e
		"--color-primary-900": "57 83 76", // #39534c
		// secondary | #b59278 
		"--color-secondary-50": "244 239 235", // #f4efeb
		"--color-secondary-100": "240 233 228", // #f0e9e4
		"--color-secondary-200": "237 228 221", // #ede4dd
		"--color-secondary-300": "225 211 201", // #e1d3c9
		"--color-secondary-400": "203 179 161", // #cbb3a1
		"--color-secondary-500": "181 146 120", // #b59278
		"--color-secondary-600": "163 131 108", // #a3836c
		"--color-secondary-700": "136 110 90", // #886e5a
		"--color-secondary-800": "109 88 72", // #6d5848
		"--color-secondary-900": "89 72 59", // #59483b
		// tertiary | #baa5c3 
		"--color-tertiary-50": "245 242 246", // #f5f2f6
		"--color-tertiary-100": "241 237 243", // #f1edf3
		"--color-tertiary-200": "238 233 240", // #eee9f0
		"--color-tertiary-300": "227 219 231", // #e3dbe7
		"--color-tertiary-400": "207 192 213", // #cfc0d5
		"--color-tertiary-500": "186 165 195", // #baa5c3
		"--color-tertiary-600": "167 149 176", // #a795b0
		"--color-tertiary-700": "140 124 146", // #8c7c92
		"--color-tertiary-800": "112 99 117", // #706375
		"--color-tertiary-900": "91 81 96", // #5b5160
		// success | #19ae86 
		"--color-success-50": "221 243 237", // #ddf3ed
		"--color-success-100": "209 239 231", // #d1efe7
		"--color-success-200": "198 235 225", // #c6ebe1
		"--color-success-300": "163 223 207", // #a3dfcf
		"--color-success-400": "94 198 170", // #5ec6aa
		"--color-success-500": "25 174 134", // #19ae86
		"--color-success-600": "23 157 121", // #179d79
		"--color-success-700": "19 131 101", // #138365
		"--color-success-800": "15 104 80", // #0f6850
		"--color-success-900": "12 85 66", // #0c5542
		// warning | #ffb938 
		"--color-warning-50": "255 245 225", // #fff5e1
		"--color-warning-100": "255 241 215", // #fff1d7
		"--color-warning-200": "255 238 205", // #ffeecd
		"--color-warning-300": "255 227 175", // #ffe3af
		"--color-warning-400": "255 206 116", // #ffce74
		"--color-warning-500": "255 185 56", // #ffb938
		"--color-warning-600": "230 167 50", // #e6a732
		"--color-warning-700": "191 139 42", // #bf8b2a
		"--color-warning-800": "153 111 34", // #996f22
		"--color-warning-900": "125 91 27", // #7d5b1b
		// error | #830101 
		"--color-error-50": "236 217 217", // #ecd9d9
		"--color-error-100": "230 204 204", // #e6cccc
		"--color-error-200": "224 192 192", // #e0c0c0
		"--color-error-300": "205 153 153", // #cd9999
		"--color-error-400": "168 77 77", // #a84d4d
		"--color-error-500": "131 1 1", // #830101
		"--color-error-600": "118 1 1", // #760101
		"--color-error-700": "98 1 1", // #620101
		"--color-error-800": "79 1 1", // #4f0101
		"--color-error-900": "64 0 0", // #400000
		// surface | #171717 
    "--color-surface-50": "255 255 255", // #dcdcdc
		"--color-surface-100": "230 230 230", // #dcdcdc
		"--color-surface-200": "197 197 197", // #c5c5c5
		"--color-surface-300": "162 162 162", // #a2a2a2
		"--color-surface-400": "93 93 93", // #5d5d5d
		"--color-surface-500": "23 23 23", // #171717
		"--color-surface-600": "21 21 21", // #151515
		"--color-surface-700": "17 17 17", // #111111
		"--color-surface-800": "14 14 14", // #0e0e0e
		"--color-surface-900": "11 11 11", // #0b0b0b
  },
};
