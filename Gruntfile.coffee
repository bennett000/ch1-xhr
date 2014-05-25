# Build For: Worker, Browser, Node
#
module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    writeBowerJson:
      workular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-workular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'workular'
            targetSrc:"git+ssh://dev.higginsregister.com/srv/bower/js-workular.git#v0.5.1"


    mkdir:
      buildEnvironement:
        options:
          create: [
            'tmp',
            'build',
            'build/browser-workular'
          ]

    jshint:
      all: 'tmp/*.js'

    uglify:
      buildWorkular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-workular/http-client.min.js.map'
        files:
          'build/browser-workular/http-client.min.js': ['tmp/intermediate.js']
      pristine:
        options:
          mangle: false
          compress: false
          beautify: true
          preserveComments: true
        files:
          'build/browser-workular/http-client.js': ['tmp/intermediate.js']

    concat:
      code:
        src: ['src/workular-shell.js']
        dest: 'tmp/intermediate.js'

    insert:
      options: {}
      workularHTTP:
        src: 'src/http.js'
        dest: 'tmp/intermediate.js'
        match: '//###HTTPBODY'
      workularXHR:
        src: 'src/inline-xhr.js'
        dest: 'tmp/intermediate.js'
        match: '//###XHRBODY'


  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-write-bower-json'
  grunt.loadNpmTasks 'grunt-insert'

  grunt.registerTask('build', ['mkdir', 'concat', 'insert', 'uglify', 'writeBowerJson'])
  grunt.registerTask('default', ['build'])

