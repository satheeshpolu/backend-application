const getISODateString = () => {
  const jsDate = new Date();
  return jsDate.toISOString();
};

module.exports = {
  getISODateString: getISODateString,
};
