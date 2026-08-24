module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // as migrations do Drizzle chegam como .sql e precisam entrar no bundle como texto
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
