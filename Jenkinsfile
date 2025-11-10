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
                       sh 'cp -f $ENV_FILE .env'
                       sh 'chmod 600 .env'
                       sh 'echo ".env file copied successfully"'
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
