module.exports = function (grunt)
{

    grunt.initConfig({


        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            postar: {
                src: 'public/source/js/**/*js',
                dest: 'public/build/postar.js'
            }
        },

        jshint: {
            options: {
                debug: true,
                esversion: 6
            },
            postar: ['public/source/**/*.js', "server/**/*.js"]
        },

        sass: {                              // Task
            postar: {                            // Target
                options: {                       // Target options
                    style: "compressed"
                },
                files: { "public/build/postar.min.css": "public/source/scss/import.scss" }
            }
        },

        uglify: {
            postar: {
                files: {
                    'public/build/postar.min.js': ['public/build/postar.js']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-contrib-sass');

    grunt.registerTask("build-dev", ["jshint:postar", "browserify:postar", "sass:postar"]);
    grunt.registerTask("build-live", ["jshint:postar", "browserify:postar", "uglify:postar", "sass:postar"]);
};
