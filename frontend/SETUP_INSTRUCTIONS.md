# Setup Instructions

## Quick Start Guide

Follow these steps to run the Smart Attendance System on your local machine.

### Step 1: Configure Environment Variables

You need to add your Supabase credentials to run the application.

1. Create a `.env` file in the project root directory (if it doesn't exist)

2. Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find these values:**
- Log in to your Supabase dashboard at https://supabase.com
- Select your project
- Go to Settings → API
- Copy the "Project URL" for `VITE_SUPABASE_URL`
- Copy the "anon/public" key for `VITE_SUPABASE_ANON_KEY`

### Step 2: Verify Database Schema

The database tables should already be created. To verify:

1. Go to your Supabase dashboard
2. Click on "Table Editor"
3. You should see two tables:
   - `students` - Stores student information and face encodings
   - `attendance_records` - Stores attendance sessions and attention data

If tables don't exist, the migration will be applied automatically when you first use the application.

### Step 3: Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Step 4: Allow Camera Permissions

When you first use the application:
1. Your browser will ask for camera permissions
2. Click "Allow" to enable face detection and registration
3. If you accidentally clicked "Block", go to browser settings and enable camera for this site

## Using the Application

### Register Students

1. Go to the "Register Students" tab
2. Enter student name (required) and email (optional)
3. Click "Start Camera to Capture Face"
4. Position your face clearly in the camera frame
5. Click "Capture & Register"
6. Repeat for all students

**Tips for best results:**
- Ensure good lighting
- Look directly at the camera
- Remove hats, sunglasses, or masks
- Make sure only one face is visible during registration

### Monitor Attendance

1. Go to the "Live Monitoring" tab
2. Click "Start Monitoring"
3. The system will:
   - Detect and recognize faces in real-time
   - Track attention levels using gaze and head pose
   - Display bounding boxes around detected faces
   - Show attention percentage for each student
   - Automatically create attendance records

**Understanding the display:**
- **Green box** = Student is attentive
- **Red box** = Student is distracted
- **Percentage** = Real-time attention score

### View Attendance Records

1. Go to the "Attendance Dashboard" tab
2. View all recorded attendance sessions
3. See detailed metrics:
   - Start and end times
   - Total session duration
   - Alert time (time spent attentive)
   - Alertness percentage
   - Attendance status (Present if ≥75% attentive)

4. Click "Export CSV" to download records for analysis

## System Requirements

- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Camera**: Working webcam required
- **Internet**: Required for Supabase connection
- **RAM**: At least 4GB recommended (face detection is memory-intensive)

## Troubleshooting

### Camera Not Working

**Problem**: "Error accessing camera" message
**Solutions**:
1. Check browser permissions
2. Ensure no other application is using the camera
3. Try refreshing the page
4. Try a different browser

### Face Not Detected

**Problem**: "No face detected" message
**Solutions**:
1. Move closer to the camera
2. Ensure adequate lighting
3. Remove obstructions (hat, mask, glasses)
4. Look directly at the camera

### Student Not Recognized

**Problem**: System shows "Unknown" instead of student name
**Solutions**:
1. Re-register the student with better lighting
2. Ensure the face is clearly visible during registration
3. Check that the student was successfully added (view Supabase dashboard)

### Low Attention Score

**Problem**: Attention percentage stays low even when looking at camera
**Solutions**:
1. Look directly at the camera/screen
2. Keep head facing forward
3. Avoid excessive head movements
4. Ensure good lighting on face

### Database Connection Issues

**Problem**: "Error" messages when registering or viewing records
**Solutions**:
1. Verify `.env` file has correct Supabase credentials
2. Check internet connection
3. Verify Supabase project is active
4. Check browser console for detailed error messages

## Performance Tips

1. **Close unnecessary browser tabs** - Face detection uses significant CPU/GPU
2. **Use good lighting** - Improves detection accuracy and speed
3. **Position camera properly** - Ensure faces are clearly visible
4. **Limit concurrent users** - System works best with 5-10 students in frame
5. **Use modern hardware** - Better CPU/GPU improves processing speed

## Privacy & Security

- Face encodings are stored as mathematical descriptors (128 numbers)
- Original images are not stored in the database
- All data is stored securely in Supabase with Row Level Security (RLS)
- Camera access is only used during active sessions
- No data is sent to third-party services

## Technical Details

### Face Detection Models
The application uses face-api.js with these pre-trained models:
- Tiny Face Detector (fast, lightweight detection)
- 68-point Face Landmarks (facial feature detection)
- Face Recognition Network (128-dimensional descriptors)
- Face Expression Recognition (emotion detection)

### Attention Tracking Algorithm
The system calculates attention based on:
1. **Gaze Direction**: Analyzes eye position relative to nose
2. **Head Pose**: Evaluates facial orientation
3. **Engagement Score**: Combines metrics into 0-100% score
4. **Threshold**: ≥75% required for "Present" status

### Database Tables

**students**
```sql
- id (uuid, primary key)
- name (text, required)
- email (text, optional)
- face_encoding (text, JSON array of 128 numbers)
- created_at (timestamp)
```

**attendance_records**
```sql
- id (uuid, primary key)
- student_id (uuid, foreign key)
- start_time (timestamp)
- end_time (timestamp)
- total_time (interval)
- alert_time (interval)
- alertness_percentage (numeric, 0-100)
- attendance_status (text, Present/Absent)
- created_at (timestamp)
```

## Support

For issues or questions:
1. Check this documentation first
2. Review the README.md for additional information
3. Check browser console for error messages
4. Verify Supabase configuration and database schema

## Next Steps

After successfully running the application:
1. Register at least 2-3 test students
2. Test the live monitoring feature
3. Verify attendance records are created correctly
4. Export a CSV file to see the data format
5. Customize the attention threshold if needed (default: 75%)

## Production Deployment

To deploy this application:
1. Build the project: `npm run build`
2. Deploy the `dist` folder to a web hosting service
3. Ensure environment variables are set in the hosting platform
4. Configure proper HTTPS for camera access
5. Set up domain and SSL certificate

Recommended hosting platforms:
- Vercel (easiest for Vite projects)
- Netlify
- Cloudflare Pages
- AWS Amplify