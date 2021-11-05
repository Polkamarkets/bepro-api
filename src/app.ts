import express from 'express';
import cors from 'cors';

import { router } from './routes';

import environment from '@config/environment';

const corsOptions = {
  origin: function (origin, callback) {
    const originWhitelist = environment.ORIGIN_WHITELIST.split(',');

    if (originWhitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin not allowed by CORS`));
    }
  }
};

const app = express();

app.use(express.json());
app.use(router);
app.use(cors(corsOptions));

export { app };
