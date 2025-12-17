using System.Security.Cryptography;
using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
using backend.Exceptions;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class InviteService : IInviteService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<User> _userManager;
    private readonly IAuditLogService _auditLogService;
    private const int INVITE_EXPIRY_DAYS = 7;

    public InviteService(ApplicationDbContext db, UserManager<User> userManager, IAuditLogService auditLogService)
    {
        _db = db;
        _userManager = userManager;
        _auditLogService = auditLogService;
    }

    public async Task<CreateInviteResponseDto?> CreateInviteAsync(
        CreateInviteDto dto,
        int merchantId,
        string invitedByUserId,
        string baseUrl)
    {
        // Validate email format
        if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains('@'))
        {
            throw new BusinessRuleException("Invalid email format");
        }

        var email = dto.Email.Trim();
        var emailLower = email.ToLowerInvariant();

        // Validate role
        if (dto.Role != UserRoles.Owner && dto.Role != UserRoles.Employee && dto.Role != UserRoles.Customer)
        {
            throw new BusinessRuleException("Invalid role");
        }

        // Check if user already exists
        // NOTE: Some test fixtures insert users directly without setting NormalizedEmail,
        // so UserManager.FindByEmailAsync() would miss them. Query by Email (case-insensitive)
        // so both production and tests behave consistently.
        var userExists = await _db.Users.AnyAsync(u =>
            u.Email != null && u.Email.ToLower() == emailLower);

        if (userExists)
        {
            throw new BusinessRuleException("User with this email already exists");
        }

        // If there's already a pending invite for this email and merchant, expire it
        var existingInvite = await _db.Invites
            .FirstOrDefaultAsync(i =>
                i.Email.ToLower() == emailLower &&
                i.MerchantId == merchantId &&
                !i.IsAccepted &&
                i.ExpiresAt > DateTime.UtcNow);

        if (existingInvite != null)
        {
            // Expire the existing invite so the new one can be used
            existingInvite.ExpiresAt = DateTime.UtcNow;
        }

        // Generate secure token
        var token = GenerateSecureToken();

        // Create invite
        var invite = new Invite
        {
            Email = emailLower,
            Role = dto.Role,
            MerchantId = merchantId,
            InvitedByUserId = invitedByUserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(INVITE_EXPIRY_DAYS),
            CreatedAt = DateTime.UtcNow,
            IsAccepted = false
        };

        _db.Invites.Add(invite);
        await _db.SaveChangesAsync();

        // Generate invite link
        var inviteLink = $"{baseUrl.TrimEnd('/')}/accept-invite?token={token}";

        return new CreateInviteResponseDto(
            Id: invite.Id,
            Email: invite.Email,
            Role: invite.Role,
            InviteLink: inviteLink,
            ExpiresAt: invite.ExpiresAt
        );
    }

    public async Task<ValidateInviteDto?> ValidateInviteTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return new ValidateInviteDto(
                Email: "",
                Role: "",
                IsValid: false,
                Message: "Token is required"
            );
        }

        var invite = await _db.Invites
            .FirstOrDefaultAsync(i => i.Token == token);

        if (invite == null)
        {
            return new ValidateInviteDto(
                Email: "",
                Role: "",
                IsValid: false,
                Message: "Invalid invite token"
            );
        }

        if (invite.IsAccepted)
        {
            return new ValidateInviteDto(
                Email: invite.Email,
                Role: invite.Role,
                IsValid: false,
                Message: "This invite has already been accepted"
            );
        }

        if (invite.ExpiresAt < DateTime.UtcNow)
        {
            return new ValidateInviteDto(
                Email: invite.Email,
                Role: invite.Role,
                IsValid: false,
                Message: "This invite has expired"
            );
        }

        // Check if user already exists (edge case)
        var userExists = await _db.Users.AnyAsync(u =>
            u.Email != null && u.Email.ToLower() == invite.Email.ToLower());

        if (userExists)
        {
            return new ValidateInviteDto(
                Email: invite.Email,
                Role: invite.Role,
                IsValid: false,
                Message: "User with this email already exists"
            );
        }

        return new ValidateInviteDto(
            Email: invite.Email,
            Role: invite.Role,
            IsValid: true,
            Message: null
        );
    }

    public async Task<UserDto?> AcceptInviteAsync(AcceptInviteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
        {
            throw new BusinessRuleException("Token is required");
        }

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6 || dto.Password.Length > 100)
        {
            throw new BusinessRuleException("Password must be between 6 and 100 characters");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new BusinessRuleException("Email is required");
        }

        var invite = await _db.Invites
            .FirstOrDefaultAsync(i => i.Token == dto.Token);

        if (invite == null)
        {
            throw new BusinessRuleException("Invalid invite token");
        }

        // Validate that the email matches the invite
        if (!invite.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessRuleException("Email does not match the invite");
        }

        if (invite.IsAccepted)
        {
            throw new BusinessRuleException("This invite has already been accepted");
        }

        if (invite.ExpiresAt < DateTime.UtcNow)
        {
            throw new BusinessRuleException("This invite has expired");
        }

        // Check if user already exists
        var userExists = await _db.Users.AnyAsync(u =>
            u.Email != null && u.Email.ToLower() == invite.Email.ToLower());

        if (userExists)
        {
            throw new BusinessRuleException("User with this email already exists");
        }

        // Create user
        var user = new User
        {
            UserName = invite.Email,
            Email = invite.Email,
            MerchantId = invite.MerchantId,
            Role = invite.Role,
            Name = dto.Name,
            Surname = dto.Surname,
            IsSuperAdmin = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BusinessRuleException($"Failed to create user: {errors}");
        }

        // Mark invite as accepted
        invite.IsAccepted = true;
        invite.AcceptedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Log audit entry for user creation
        await _auditLogService.LogUserCreatedAsync(
            user.Id,
            user.MerchantId ?? 0,
            performedByUserId: invite.InvitedByUserId
        );

        return new UserDto(
            Id: user.Id,
            MerchantId: user.MerchantId,
            Email: user.Email ?? "",
            Name: user.Name ?? "",
            Surname: user.Surname ?? "",
            PhoneNumber: user.PhoneNumber ?? "",
            Role: user.Role,
            IsSuperAdmin: user.IsSuperAdmin,
            IsActive: user.IsActive,
            LastLoginAt: user.LastLoginAt,
            CreatedAt: user.CreatedAt,
            UpdatedAt: user.UpdatedAt
        );
    }

    private string GenerateSecureToken()
    {
        // Generate a cryptographically secure random token
        var bytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        // Convert to base64 and make URL-safe (replace + with -, / with _, remove padding)
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
