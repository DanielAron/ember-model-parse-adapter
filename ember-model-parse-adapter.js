function classToEndpoint(klass) {
  return klass.toString().split('.')[1];
}

Ember.ParseAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var endpoint = classToEndpoint(record.constructor);

    return this._ajax(endpoint + "/" + id).then(function(json) {
      record.load(id, json);
    }, function(err) {
      console.log("Error occurred:", err);
    });
  },

  findAll: function(klass, records) {
    var endpoint = classToEndpoint(klass);

    return this._ajax(endpoint).then(function(json) {
      records.load(klass, json.results);
    }, function(err) {
      console.log("Error occurred:", err);
    });
  },

  createRecord: function(record) {
    var endpoint = classToEndpoint(record.constructor),
      primaryKey = Ember.get(record.constructor, 'primaryKey'),
      self = this;

    return this._ajax(endpoint, record.toJSON(), "POST").then(function(data) {
      self.didCreateRecord(record, data);
    });
  },

  didCreateRecord: function(record, data) {
    var rootKey = get(record.constructor, 'rootKey'),
        primaryKey = get(record.constructor, 'primaryKey'),
        dataToLoad = rootKey ? data[rootKey] : data;

    record.load(dataToLoad[primaryKey], dataToLoad);
    record.didCreateRecord();
  },

  saveRecord: function(record) {
    var primaryKey = Ember.get(record.constructor, 'primaryKey'),
        id = Ember.get(record, primaryKey),
        url = [ classToEndpoint(record.constructor), id ].join("/"),
        self = this;

    return this._ajax(url, record.toJSON(), "PUT").then(function(data) {  // TODO: Some APIs may or may not return data
      self.didSaveRecord(record, data);
    });
  },

  _ajax: function(urlSuffix, params, method) {
    var url = "https://api.parse.com/1/classes/" + urlSuffix;
    return $.ajax(url, $.extend({
      headers: {
        "X-Parse-Application-Id": "",
        "X-Parse-REST-API-Key": ""
      }
    }, params), method || "GET");
  }
});