# Build For: Worker, Browser, Node
#
module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    writeBowerJson:
      angular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-angular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'angular'
            targetSrc: '1.2.9'
      workular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-workular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'workular'
            targetSrc:"git+ssh://dev.higginsregister.com/srv/bower/js-workular.git#v0.5.1"

    replace:
      angular:
        src: 'tmp/ruuid-browser-workular.js'
        dest: 'tmp/ruuid-browser-angular.js'
        replacements: [{from:'workular', to:'angular'}]

    mkdir:
      buildEnvironement:
        options:
          create: [
            'tmp',
            'build',
            'build/browser-angular',
            'build/browser-workular',
            'build/node-workular',
            'build/node-workular/lib'
          ]

    jshint:
      all: 'tmp/*.js'

    uglify:
      buildWorkular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-workular/ruuid.min.js.map'
        files:
          'build/browser-workular/ruuid.min.js': ['tmp/ruuid-browser-workular.js']
      buildAngular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-angular/ruuid.min.js.map'
        files:
          'build/browser-angular/ruuid.min.js': ['tmp/ruuid-browser-angular.js']
      pristine:
        options:
          mangle: false
          compress: false
          beautify: true
          preserveComments: true
        files:
          'build/browser-workular/ruuid.js': ['tmp/ruuid-browser-workular.js']
          'build/browser-angular/ruuid.js': ['tmp/ruuid-browser-angular.js']

    copy:
      asyncNodeWorkular:
        expand: true
        flatten: true
        filter: 'isFile'
        src: 'src/ruuid.js'
        dest: 'build/node-workular/'
      packageNodeWorkular:
        expand: true
        flatten: true
        filter: 'isFile'
        src: 'package.json'
        dest: 'build/node-workular/'
      readmeNodeWorkular:
        expand: true
        flatten: true
        filter: 'isFile'
        src: 'README.md'
        dest: 'build/node-workular/'

    preprocessor:
      node:
        options:
          context:
            NODE: true
        files:
          'tmp/ruuid-node.js': ['src/ruuid.js']
      browser:
        options:
          context:
            BROWSER: true
        files:
          'tmp/ruuid-browser-workular.js': ['src/ruuid.js']


  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-text-replace'
  grunt.loadNpmTasks 'grunt-preprocessor'
  grunt.loadNpmTasks 'grunt-write-bower-json'

  grunt.registerTask('build', ['mkdir', 'preprocessor', 'replace', 'uglify', 'copy', 'writeBowerJson'])
  grunt.registerTask('default', ['build'])

