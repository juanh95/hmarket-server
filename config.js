exports.email = {
    method: 'post',
    url: 'https://random.api.randomkey.io/v1/email',
    headers: { 
      'auth': '645c7973c727934f42fc6851ddaf441b', 
      'Content-Type': 'application/json'
    },
    data : JSON.stringify({"records":50})
}
  
exports.firstName = {
    method: 'post',
    url: 'https://random.api.randomkey.io/v1/name/first',
    headers: { 
        'auth': '645c7973c727934f42fc6851ddaf441b', 
        'Content-Type': 'application/json'
    },
    data : JSON.stringify({"gender":"0","region":"us","records":50})
}
  
exports.lastName = {
    method: 'post',
    url: 'https://random.api.randomkey.io/v1/name/last',
    headers: { 
        'auth': '645c7973c727934f42fc6851ddaf441b', 
        'Content-Type': 'application/json'
    },
    data : JSON.stringify({"gender":"0","region":"us","records":50})
}