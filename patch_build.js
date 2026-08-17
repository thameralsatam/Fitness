const fs = require('fs');
let content = fs.readFileSync('android/build.gradle', 'utf8');
if (!content.includes('org.jetbrains.kotlin.android')) {
    content = content.replace(
        "classpath 'com.android.tools.build:gradle:8.13.0'", 
        "classpath 'com.android.tools.build:gradle:8.13.0'\n        classpath \"org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.23\""
    );
    fs.writeFileSync('android/build.gradle', content);
}
