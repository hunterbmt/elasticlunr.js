/*!
 * elasticlunr.stopWordFilter
 * Copyright (C) @YEAR Oliver Nightingale
 * Copyright (C) @YEAR Wei Song
 */

/**
 * elasticlunr.stopWordFilter is an English language stop words filter, any words
 * contained in the stop word list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 * Currently this StopwordFilter using dictionary to do O(1) time complexity stop word filtering.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @return {String}
 * @see elasticlunr.Pipeline
 */
elasticlunr.stopWordFilter = function (token) {
  if (token && elasticlunr.stopWordFilter.stopWords[token] !== true) {
    return token;
  }
};

/**
 * Remove predefined stop words
 * if user want to use customized stop words, user could use this function to delete
 * all predefined stopwords.
 *
 * @return {null}
 */
elasticlunr.clearStopWords = function () {
  elasticlunr.stopWordFilter.stopWords = {};
};

/**
 * Add customized stop words
 * user could use this function to add customized stop words
 *
 * @params {Array} words customized stop words
 * @return {null}
 */
elasticlunr.addStopWords = function (words) {
  if (words == null || Array.isArray(words) === false) return;

  words.forEach(function (word) {
    elasticlunr.stopWordFilter.stopWords[word] = true;
  }, this);
};

/**
 * Reset to default stop words
 * user could use this function to restore default stop words
 *
 * @return {null}
 */
elasticlunr.resetStopWords = function () {
  elasticlunr.stopWordFilter.stopWords = elasticlunr.defaultStopWords;
};

elasticlunr.defaultStopWords = {
  "": true,
  "aber": true,
  "alle": true,
  "allem": true,
  "allen": true,
  "aller": true,
  "alles": true,
  "als": true,
  "also": true,
  "am": true,
  "an": true,
  "ander": true,
  "andere": true,
  "anderem": true,
  "anderen": true,
  "anderer": true,
  "anderes": true,
  "anderm": true,
  "andern": true,
  "anderr": true,
  "anders": true,
  "auch": true,
  "auf": true,
  "aus": true,
  "bei": true,
  "bin": true,
  "bis": true,
  "bist": true,
  "da": true,
  "damit": true,
  "dann": true,
  "der": true,
  "den": true,
  "des": true,
  "dem": true,
  "die": true,
  "das": true,
  "daß": true,
  "derselbe": true,
  "derselben": true,
  "denselben": true,
  "desselben": true,
  "demselben": true,
  "dieselbe": true,
  "dieselben": true,
  "dasselbe": true,
  "dazu": true,
  "dein": true,
  "deine": true,
  "deinem": true,
  "deinen": true,
  "deiner": true,
  "deines": true,
  "denn": true,
  "derer": true,
  "dessen": true,
  "dich": true,
  "dir": true,
  "du": true,
  "dies": true,
  "diese": true,
  "diesem": true,
  "diesen": true,
  "dieser": true,
  "dieses": true,
  "doch": true,
  "dort": true,
  "durch": true,
  "ein": true,
  "eine": true,
  "einem": true,
  "einen": true,
  "einer": true,
  "eines": true,
  "einig": true,
  "einige": true,
  "einigem": true,
  "einigen": true,
  "einiger": true,
  "einiges": true,
  "einmal": true,
  "er": true,
  "ihn": true,
  "ihm": true,
  "es": true,
  "etwas": true,
  "euer": true,
  "eure": true,
  "eurem": true,
  "euren": true,
  "eurer": true,
  "eures": true,
  "für": true,
  "gegen": true,
  "gewesen": true,
  "hab": true,
  "habe": true,
  "haben": true,
  "hat": true,
  "hatte": true,
  "hatten": true,
  "hier": true,
  "hin": true,
  "hinter": true,
  "ich": true,
  "mich": true,
  "mir": true,
  "ihr": true,
  "ihre": true,
  "ihrem": true,
  "ihren": true,
  "ihrer": true,
  "ihres": true,
  "euch": true,
  "im": true,
  "in": true,
  "indem": true,
  "ins": true,
  "ist": true,
  "jede": true,
  "jedem": true,
  "jeden": true,
  "jeder": true,
  "jedes": true,
  "jene": true,
  "jenem": true,
  "jenen": true,
  "jener": true,
  "jenes": true,
  "jetzt": true,
  "kann": true,
  "kein": true,
  "keine": true,
  "keinem": true,
  "keinen": true,
  "keiner": true,
  "keines": true,
  "können": true,
  "könnte": true,
  "machen": true,
  "man": true,
  "manche": true,
  "manchem": true,
  "manchen": true,
  "mancher": true,
  "manches": true,
  "mein": true,
  "meine": true,
  "meinem": true,
  "meinen": true,
  "meiner": true,
  "meines": true,
  "mit": true,
  "muss": true,
  "musste": true,
  "nach": true,
  "nicht": true,
  "nichts": true,
  "noch": true,
  "nun": true,
  "nur": true,
  "ob": true,
  "oder": true,
  "ohne": true,
  "sehr": true,
  "sein": true,
  "seine": true,
  "seinem": true,
  "seinen": true,
  "seiner": true,
  "seines": true,
  "selbst": true,
  "sich": true,
  "sie": true,
  "ihnen": true,
  "sind": true,
  "so": true,
  "solche": true,
  "solchem": true,
  "solchen": true,
  "solcher": true,
  "solches": true,
  "soll": true,
  "sollte": true,
  "sondern": true,
  "sonst": true,
  "über": true,
  "um": true,
  "und": true,
  "uns": true,
  "unse": true,
  "unsem": true,
  "unsen": true,
  "unser": true,
  "unses": true,
  "unter": true,
  "viel": true,
  "vom": true,
  "von": true,
  "vor": true,
  "während": true,
  "war": true,
  "waren": true,
  "warst": true,
  "was": true,
  "weg": true,
  "weil": true,
  "weiter": true,
  "welche": true,
  "welchem": true,
  "welchen": true,
  "welcher": true,
  "welches": true,
  "wenn": true,
  "werde": true,
  "werden": true,
  "wie": true,
  "wieder": true,
  "will": true,
  "wir": true,
  "wird": true,
  "wirst": true,
  "wo": true,
  "wollen": true,
  "wollte": true,
  "würde": true,
  "würden": true,
  "zu": true,
  "zum": true,
  "zur": true,
  "zwar": true,
  "zwischen": true
};

elasticlunr.stopWordFilter.stopWords = elasticlunr.defaultStopWords;

elasticlunr.Pipeline.registerFunction(elasticlunr.stopWordFilter, 'stopWordFilter');
