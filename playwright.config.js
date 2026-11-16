import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.js',use:{baseURL:'http://127.0.0.1:4181'},webServer:{command:'python -m http.server 4181 --bind 127.0.0.1',url:'http://127.0.0.1:4181',reuseExistingServer:false}});


