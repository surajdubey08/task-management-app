using BCrypt.Net;
using System.Security.Cryptography;

namespace TaskManagement.API.Services
{
    public class PasswordService : IPasswordService
    {
        private readonly ILogger<PasswordService> _logger;
        private readonly IMemoryCache _memoryCache;

        public PasswordService(ILogger<PasswordService> logger, IMemoryCache memoryCache)
        {
            _logger = logger;
            _memoryCache = memoryCache;
        }

        public string HashPassword(string password)
        {
            try
            {
                return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hashing password");
                throw;
            }
        }

        public bool VerifyPassword(string password, string hash)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying password");
                return false;
            }
        }

        public string GenerateResetToken()
        {
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        public async Task<bool> SaveResetTokenAsync(string email, string token)
        {
            try
            {
                var cacheKey = $"reset_token_{email}";
                var expiry = TimeSpan.FromHours(1); // Token expires in 1 hour
                
                _memoryCache.Set(cacheKey, token, expiry);
                
                _logger.LogInformation("Password reset token saved for email: {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving reset token for email: {Email}", email);
                return false;
            }
        }

        public async Task<bool> ValidateResetTokenAsync(string email, string token)
        {
            try
            {
                var cacheKey = $"reset_token_{email}";
                
                if (_memoryCache.TryGetValue(cacheKey, out string? storedToken))
                {
                    return storedToken == token;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating reset token for email: {Email}", email);
                return false;
            }
        }

        public async Task<bool> ClearResetTokenAsync(string email)
        {
            try
            {
                var cacheKey = $"reset_token_{email}";
                _memoryCache.Remove(cacheKey);
                
                _logger.LogInformation("Password reset token cleared for email: {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing reset token for email: {Email}", email);
                return false;
            }
        }
    }
}