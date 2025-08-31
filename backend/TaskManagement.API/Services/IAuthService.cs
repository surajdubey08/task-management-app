using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
        Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto?> RefreshTokenAsync(RefreshTokenDto refreshTokenDto);
        Task<bool> RevokeTokenAsync(string refreshToken);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
        Task<bool> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);
        Task<bool> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
        Task<UserDto?> GetCurrentUserAsync(int userId);
        Task<bool> ValidateUserAsync(int userId, UserRole? requiredRole = null);
    }

    public interface ITokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        Task<User?> GetUserFromExpiredTokenAsync(string token);
        Task<bool> SaveRefreshTokenAsync(int userId, string refreshToken, DateTime expiry);
        Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken);
        Task<bool> RevokeRefreshTokenAsync(int userId);
    }

    public interface IPasswordService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
        string GenerateResetToken();
        Task<bool> SaveResetTokenAsync(string email, string token);
        Task<bool> ValidateResetTokenAsync(string email, string token);
        Task<bool> ClearResetTokenAsync(string email);
    }
}