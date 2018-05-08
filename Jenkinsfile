pipeline {
  agent any
  parameters {
    string(defaultValue: 'gpf', description: 'web deployment prefix', name: 'webPrefix', trim: true)
    string(defaultValue: 'gpf', description: 'directory prefix', name: 'dirPrefix', trim: true)
  }
  stages {
    stage ('Start') {
      steps {
        slackSend (
          color: '#FFFF00',
          message: "STARTED: Job '${env.JOB_NAME} " +
            "[${env.BUILD_NUMBER}]' (${env.BUILD_URL})"
        )
      }
    }
    stage('npm install') {
      steps {
        sh "npm install"
      }
    }
    stage('gpfjs build (gpfjs)') {
      when {
        expression { params.webPrefix == "gpfjs" }
      }
      steps {
        sh "ng build --prod --aot -e deploy --bh '/${params.webPrefix}/' -d '/static/${params.dirPrefix}/'"
      }
    }
    stage('gpfjs build (gpf or gpf38)') {
      when {
        expression { params.webPrefix == 'gpf'  || params.webPrefix == 'gpf38' }
      }
      steps {
        sh "ng build --prod --aot -e deploy --bh '/${params.webPrefix}/' -d '${params.dirPrefix}/'"
      }
    }
    stage('gpfjs archive') {
      steps {
        sh "python ppindex.py"
        sh "cd dist/ && tar zcvf ../gpfjs-dist-${params.webPrefix}.tar.gz . && cd -"
        
      }
    }
  }
  post {
    success {
      slackSend (
        color: '#00FF00',
        message: "SUCCESSFUL: Job '${env.JOB_NAME} " +
                 "[${env.BUILD_NUMBER}]' (${env.BUILD_URL})"
      )
      archive "gpfjs-dist-${params.webPrefix}.tar.gz"
      fingerprint "gpfjs-dist-${params.webPrefix}.tar.gz"
    }
    failure {
      slackSend (
        color: '#FF0000',
        message: "FAILED: Job '${env.JOB_NAME} " +
                 "[${env.BUILD_NUMBER}]' (${env.BUILD_URL})"
      )
    }
  }
}
