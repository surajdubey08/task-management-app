using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Repositories;

namespace TaskManagement.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordService _passwordService;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthService> _logger;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordService passwordService,
            IMapper mapper,
            ILogger<AuthService> logger,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordService = passwordService;
            _mapper = mapper;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
        {
            try
            {
                var user = await _userRepository.GetByEmailAsync(loginDto.Email);
                if (user == null)
                {
                    _logger.LogWarning("Login attempt for non-existent email: {Email}", loginDto.Email);
                    return null;
                }

                if (user.Status != AccountStatus.Active)
                {
                    _logger.LogWarning("Login attempt for inactive user: {Email}, Status: {Status}", loginDto.Email, user.Status);
                    return null;
                }

                if (!_passwordService.VerifyPassword(loginDto.Password, user.PasswordHash))
                {
                    _logger.LogWarning("Invalid password attempt for user: {Email}", loginDto.Email);
                    return null;
                }

                // Update last login
                user.LastLoginAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user);

                var accessToken = _tokenService.GenerateAccessToken(user);
                var refreshToken = _tokenService.GenerateRefreshToken();
                
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var refreshTokenExpiryDays = int.Parse(jwtSettings["RefreshTokenExpiryDays"] ?? "7");
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(refreshTokenExpiryDays);

                await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken, refreshTokenExpiry);

                _logger.LogInformation("User logged in successfully: {Email}", loginDto.Email);

                return new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationMinutes"] ?? "60")),
                    User = _mapper.Map<UserDto>(user)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", loginDto.Email);
                return null;
            }
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userRepository.GetByEmailAsync(registerDto.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning("Registration attempt for existing email: {Email}", registerDto.Email);
                    return null;
                }

                // Create new user
                var user = new User
                {
                    Name = registerDto.Name,
                    Email = registerDto.Email,
                    PasswordHash = _passwordService.HashPassword(registerDto.Password),
                    PhoneNumber = registerDto.PhoneNumber,
                    Department = registerDto.Department,
                    Role = UserRole.Member,
                    Status = AccountStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createdUser = await _userRepository.CreateAsync(user);
                
                var accessToken = _tokenService.GenerateAccessToken(createdUser);
                var refreshToken = _tokenService.GenerateRefreshToken();
                
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var refreshTokenExpiryDays = int.Parse(jwtSettings["RefreshTokenExpiryDays"] ?? "7");
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(refreshTokenExpiryDays);

                await _tokenService.SaveRefreshTokenAsync(createdUser.Id, refreshToken, refreshTokenExpiry);

                _logger.LogInformation("User registered successfully: {Email}", registerDto.Email);

                return new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationMinutes"] ?? "60")),
                    User = _mapper.Map<UserDto>(createdUser)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", registerDto.Email);
                return null;
            }
        }

        public async Task<AuthResponseDto?> RefreshTokenAsync(RefreshTokenDto refreshTokenDto)
        {
            try
            {
                var user = await _tokenService.GetUserFromExpiredTokenAsync(refreshTokenDto.AccessToken);
                if (user == null)
                {
                    _logger.LogWarning("Invalid access token in refresh request");
                    return null;
                }

                if (!await _tokenService.ValidateRefreshTokenAsync(user.Id, refreshTokenDto.RefreshToken))
                {
                    _logger.LogWarning("Invalid refresh token for user: {UserId}", user.Id);
                    return null;
                }

                if (user.Status != AccountStatus.Active)
                {
                    _logger.LogWarning("Refresh token attempt for inactive user: {UserId}, Status: {Status}", user.Id, user.Status);
                    return null;
                }

                var newAccessToken = _tokenService.GenerateAccessToken(user);
                var newRefreshToken = _tokenService.GenerateRefreshToken();
                
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var refreshTokenExpiryDays = int.Parse(jwtSettings["RefreshTokenExpiryDays"] ?? "7");
                var refreshTokenExpiry = DateTime.UtcNow.AddDays(refreshTokenExpiryDays);

                await _tokenService.SaveRefreshTokenAsync(user.Id, newRefreshToken, refreshTokenExpiry);

                _logger.LogInformation("Token refreshed successfully for user: {UserId}", user.Id);

                return new AuthResponseDto
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationMinutes"] ?? "60")),
                    User = _mapper.Map<UserDto>(user)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token refresh");
                return null;
            }
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            try
            {
                // Since we don't have a direct way to find user by refresh token,
                // we'll need to clear it during logout through user context
                // For now, this will be implemented at the controller level
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking token");
                return false;
            }
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Password change attempt for non-existent user: {UserId}", userId);
                    return false;
                }

                if (!_passwordService.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    _logger.LogWarning("Invalid current password in change attempt for user: {UserId}", userId);
                    return false;
                }

                user.PasswordHash = _passwordService.HashPassword(changePasswordDto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                // Revoke all refresh tokens on password change
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _userRepository.UpdateAsync(user);

                _logger.LogInformation("Password changed successfully for user: {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user: {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
        {
            try
            {
                var user = await _userRepository.GetByEmailAsync(forgotPasswordDto.Email);
                if (user == null)
                {
                    // Don't reveal if email exists or not for security
                    _logger.LogInformation("Password reset requested for non-existent email: {Email}", forgotPasswordDto.Email);
                    return true;
                }

                if (user.Status != AccountStatus.Active)
                {
                    _logger.LogWarning("Password reset requested for inactive user: {Email}", forgotPasswordDto.Email);
                    return true; // Don't reveal account status
                }

                var resetToken = _passwordService.GenerateResetToken();
                await _passwordService.SaveResetTokenAsync(forgotPasswordDto.Email, resetToken);

                // TODO: Send email with reset token
                // For now, just log it (in production, integrate with email service)
                _logger.LogInformation("Password reset token generated for {Email}: {Token}", forgotPasswordDto.Email, resetToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing forgot password for email: {Email}", forgotPasswordDto.Email);
                return false;
            }
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
        {
            try
            {
                if (!await _passwordService.ValidateResetTokenAsync(resetPasswordDto.Email, resetPasswordDto.Token))
                {
                    _logger.LogWarning("Invalid reset token for email: {Email}", resetPasswordDto.Email);
                    return false;
                }

                var user = await _userRepository.GetByEmailAsync(resetPasswordDto.Email);
                if (user == null || user.Status != AccountStatus.Active)
                {
                    _logger.LogWarning("Password reset attempt for invalid user: {Email}", resetPasswordDto.Email);
                    return false;
                }

                user.PasswordHash = _passwordService.HashPassword(resetPasswordDto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                // Revoke all refresh tokens on password reset
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _userRepository.UpdateAsync(user);
                await _passwordService.ClearResetTokenAsync(resetPasswordDto.Email);

                _logger.LogInformation("Password reset successfully for email: {Email}", resetPasswordDto.Email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password for email: {Email}", resetPasswordDto.Email);
                return false;
            }
        }

        public async Task<UserDto?> GetCurrentUserAsync(int userId)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                return user != null ? _mapper.Map<UserDto>(user) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user: {UserId}", userId);
                return null;
            }
        }

        public async Task<bool> ValidateUserAsync(int userId, UserRole? requiredRole = null)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null || user.Status != AccountStatus.Active)
                {
                    return false;
                }

                if (requiredRole.HasValue && user.Role > requiredRole.Value)
                {
                    return false; // Higher role number means lower privilege
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating user: {UserId}", userId);
                return false;
            }
        }
    }
}