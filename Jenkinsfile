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
                    withCredentials([file(credentialsId: 'SLACK_ANALYTICS_BOT', variable: 'ENV_FILE')]) {
                        // Ensure the .env file exists and has the correct permissions
                        sh 'touch .env'
                        sh 'chown jenkins:jenkins .env'
                        sh 'chmod 664 .env'

                        // Copy the entire .env file instead of echoing a single variable
                        sh 'cp $ENV_FILE .env'
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
               sh 'docker stop slack-bot || true'
               sh 'docker rm slack-bot || true'
               sh 'docker run -d --name slack-bot -p 6960:6960 slack-bot:latest'
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
