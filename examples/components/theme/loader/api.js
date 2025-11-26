import Element from 'main/index.js';
import { post, get } from './ajax';

const { version } = Element;

const hostList = {
  local: 'http://localhost:3008/',
  production: 'https://element-api.ele.me/element/theme/'
};

const host = hostList[process.env.FAAS_ENV] || hostList.production;

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
const hasPromise = typeof window !== 'undefined' && !!window.Promise;

const fallbackDefaultConfig = [
  {
    name: 'color',
    config: [
      { name: true, key: '$--color-primary', value: '#409EFF', order: 1 },
      { name: true, key: '$--color-success', value: '#67C23A', order: 2 },
      { name: true, key: '$--color-warning', value: '#E6A23C', order: 3 },
      { name: true, key: '$--color-danger', value: '#F56C6C', order: 4 },
      { name: true, key: '$--color-info', value: '#909399', order: 5 },
      { name: true, key: '$--color-white', value: '#FFFFFF', order: 6 },
      { name: true, key: '$--color-black', value: '#000000', order: 7 },
      { name: true, key: '$--color-text-primary', value: '#303133', order: 8 },
      { name: true, key: '$--color-text-regular', value: '#606266', order: 9 },
      { name: true, key: '$--color-text-secondary', value: '#909399', order: 10 },
      { name: true, key: '$--color-text-placeholder', value: '#C0C4CC', order: 11 },
      { name: true, key: '$--border-color-base', value: '#DCDFE6', order: 12 },
      { name: true, key: '$--border-color-light', value: '#E4E7ED', order: 13 },
      { name: true, key: '$--border-color-lighter', value: '#EBEEF5', order: 14 },
      { name: true, key: '$--border-color-extra-light', value: '#F2F6FC', order: 15 },
      { name: true, key: '$--background-color-base', value: '#F5F7FA', order: 16 }
    ]
  },
  {
    name: 'typography',
    config: [
      { name: true, key: '$--font-size-extra-large', value: '28px', order: 1 },
      { name: true, key: '$--font-size-large', value: '22px', order: 2 },
      { name: true, key: '$--font-size-medium', value: '16px', order: 3 },
      { name: true, key: '$--font-size-base', value: '14px', order: 4 },
      { name: true, key: '$--font-size-small', value: '13px', order: 5 },
      { name: true, key: '$--font-size-extra-small', value: '12px', order: 6 },
      { name: true, key: '$--font-weight-primary', value: '500', order: 7 },
      { name: true, key: '$--font-weight-secondary', value: '400', order: 8 },
      { name: true, key: '$--font-line-height-primary', value: '24px', order: 9 },
      { name: true, key: '$--font-line-height-secondary', value: '20px', order: 10 }
    ]
  },
  {
    name: 'border',
    config: [
      { name: true, key: '$--border-radius-base', value: '4px', order: 1 },
      { name: true, key: '$--border-radius-small', value: '2px', order: 2 },
      { name: true, key: '$--border-radius-circle', value: '50%', order: 3 },
      { name: true, key: '$--border-radius-zero', value: '0', order: 4 },
      { name: true, key: '$--box-shadow-base', value: '0 2px 12px 0 rgba(0,0,0,0.1)', order: 5 },
      { name: true, key: '$--box-shadow-dark', value: '0 2px 12px 0 rgba(0,0,0,0.2)', order: 6 },
      { name: true, key: '$--box-shadow-light', value: '0 2px 12px 0 rgba(0,0,0,0.08)', order: 7 }
    ]
  },
  {
    name: 'button',
    config: [
      { key: '$--button-primary-background-color', value: '$--color-primary', order: 1 }
    ]
  }
];

export const getVars = () => {
  if (isDev && (!process.env || !process.env.FAAS_ENV)) {
    if (hasPromise) return window.Promise.resolve(fallbackDefaultConfig);
    return get(`${host}getVariable?version=${version}`);
  }
  return get(`${host}getVariable?version=${version}`);
};

export const updateVars = (data, cb) => {
  if (isDev && (!process.env || !process.env.FAAS_ENV)) {
    if (hasPromise) return window.Promise.resolve('');
    return post(`${host}updateVariable?version=${version}`, data, cb);
  }
  return post(`${host}updateVariable?version=${version}`, data, cb);
};
