var path = require('path')
var resumer = require('resumer')
var basicAuth = require('basic-auth')
var createFormList = require('openrosa-formlist')
var Octokat = require('octokat')

/**
 * Searches for xml form files on Gist and returns a valid
 * OpenRosa formList xml.
 */
module.exports = function (req, res, next) {
  var user = basicAuth(req)

  var octo = new Octokat({
    username: user.name,
    password: user.pass
  })

  octo.gists(req.params.gist_id).read(function (err, data) {
    data = JSON.parse(data)
    if (err) return next(err)
    var isXml
    var formStream
    var formStreams = []
    var files = data.files

    for (var filename in files) {
      isXml = (path.extname(filename) === '.xml')
      if (isXml) {
        formStream = resumer().queue(files[filename].content).end()
        formStream.uri = {
          href: files[filename].raw_url
        }
        formStreams.push(formStream)
      }
    }

    createFormList(formStreams, function (err, formlistXml) {
      if (err) return next(err)
      res.set('content-type', 'text/xml; charset=utf-8')
      res.status(200).send(formlistXml)
    })
  })
}
