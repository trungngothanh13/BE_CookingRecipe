/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         name:
 *           type: string
 *           description: Full name for profile/certificate
 *         username:
 *           type: string
 *           description: Username (unique)
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         profilePicture:
 *           type: string
 *           nullable: true
 *           description: URL to profile picture
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UserRegistration:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - username
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 120
 *           description: Full name
 *         email:
 *           type: string
 *           format: email
 *           description: Valid email address
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Unique username
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Password (will be hashed)
 *         profilePicture:
 *           type: string
 *           nullable: true
 *           description: Optional profile picture URL (usually uploaded later)
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *     UserProfileUpdate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 120
 *         email:
 *           type: string
 *           format: email
 *     CourseOverview:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         thumbnail:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *         difficulty:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         duration:
 *           type: integer
 *           nullable: true
 *         moduleCount:
 *           type: integer
 *         rating:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CourseProgress:
 *       type: object
 *       properties:
 *         completedLessons:
 *           type: integer
 *         totalLessons:
 *           type: integer
 *         percent:
 *           type: integer
 *     CourseLearningDetail:
 *       type: object
 *       properties:
 *         course:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             thumbnail:
 *               type: string
 *               nullable: true
 *         modules:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               title:
 *                 type: string
 *               lessons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     contentType:
 *                       type: string
 *                     isCompleted:
 *                       type: boolean
 *                     score:
 *                       type: integer
 *                       nullable: true
 *         progress:
 *           $ref: '#/components/schemas/CourseProgress'
 *     CourseReview:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         username:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         courseId:
 *           type: integer
 *         title:
 *           type: string
 *         price:
 *           type: number
 *         thumbnail:
 *           type: string
 *           nullable: true
 *         addedAt:
 *           type: string
 *           format: date-time
 *     OrderItem:
 *       type: object
 *       properties:
 *         courseId:
 *           type: integer
 *         title:
 *           type: string
 *         price:
 *           type: number
 *         thumbnail:
 *           type: string
 *           nullable: true
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         totalAmount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           nullable: true
 *         paymentProof:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         verifiedBy:
 *           type: integer
 *           nullable: true
 *         courses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     CertificateEligibilityError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Certificate is available after completing more than 95% progress
 */

