pipeline {
  agent { label 'piglet' }
  options {
    copyArtifactPermission('/iossifovlab/*,/seqpipe/*');
    disableConcurrentBuilds()
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
      script {
        try {
          junit 'coverage/junit-report.xml'

           cobertura coberturaReportFile: 'coverage/cobertura-coverage.xml', enableNewApi: true
        } finally {
          zulipNotification(
            topic: "${env.JOB_NAME}"
          )
        }
      }
    }
  }
}
