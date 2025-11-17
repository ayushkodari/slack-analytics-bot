pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage("Environment Setup") {
    steps {
       script {
            withCredentials([file(credentialsId: 'SLACK_ANALYTICS_BOT', variable: 'ENV_FILE_SLACK')]) {
                // Ensure the .env file exists and has the correct permissions
                // sh 'touch .env.production'
                // sh 'chown jenkins:jenkins .env.production'
                // sh 'chmod 664 .env.production'
                sh 'echo "ENV_FILE_SLACK path: $ENV_FILE_SLACK"'

                // Copy the credentials file content to .env.production
                sh 'cat $ENV_FILE_SLACK > .env.production'
                 sh 'chmod 644 .env.production'
            }
       }
    }
}

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t slack_analytics_bot:${BUILD_NUMBER} -t slack_analytics_bot:latest .'
            }
        }
        
        stage('Deploy') {
            steps {
               sh 'docker stop slack_analytics_bot || true'
               sh 'docker rm slack_analytics_bot || true'
               sh 'docker run -d --name slack_analytics_bot -p 6960:6960 slack_analytics_bot:latest'
            }
        }
    }

    post {
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed!"
        }
    }
}
