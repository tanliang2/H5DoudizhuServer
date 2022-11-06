'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'mongo',
  adapter: {
    mongo: {
      host: '127.0.0.1',
      port: '27017',
      database: 'mahjong',
      user: 'hotniao',
      password: '18665872276',
      prefix: '',
      encoding: 'utf8'
    }
  }
};
