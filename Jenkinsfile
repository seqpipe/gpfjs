pipeline {
  agent { label 'piglet || pooh || dory' }
  options {
    copyArtifactPermission('/iossifovlab/*,/seqpipe/*');
  }
  environment {
    BUILD_SCRIPTS_BUILD_DOCKER_REGISTRY_USERNAME = credentials('jenkins-registry.seqpipe.org.user')
    BUILD_SCRIPTS_BUILD_DOCKER_REGISTRY_PASSWORD_FILE = credentials('jenkins-registry.seqpipe.org.passwd')
  }

  stages {
    stage('Start') {
      steps {
        zulipSend(
          message: "Started build #${env.BUILD_NUMBER} of project ${env.JOB_NAME} (${env.BUILD_URL})",
          topic: "${env.JOB_NAME}")
      }
    }
    stage('Generate stages') {
      steps {
        sh "./build.sh preset:slow build_no:${env.BUILD_NUMBER} generate_jenkins_init:yes"
        script {
          load('Jenkinsfile.generated-stages')
        }
      }
    }
  }
  post {
    always {
      junit 'coverage/junit-report.xml'

      recordIssues(
        enabledForFailure: true, aggregatingResults: false,
        tools: [
          junitParser(pattern: 'coverage/junit-report.xml', reportEncoding: 'UTF-8', id: 'junit', name: 'Test results'),
        ]
      )

      step([
        $class: 'CoberturaPublisher',
        coberturaReportFile: 'coverage/cobertura-coverage.xml'
      ])

      zulipNotification(
        topic: "${env.JOB_NAME}"
      )
    }
  }
}
