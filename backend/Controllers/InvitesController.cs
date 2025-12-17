using backend.Dtos;
using backend.Enums;
using backend.Exceptions;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/invites")]
[Authorize]
public class InvitesController : ControllerBase
{
    private readonly IInviteService _inviteService;
    private readonly IConfiguration _configuration;

    public InvitesController(IInviteService inviteService, IConfiguration configuration)
    {
        _inviteService = inviteService;
        _configuration = configuration;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
    }

    private int? GetCurrentUserMerchantId()
    {
        var merchantIdClaim = User.FindFirstValue("merchantId");
        if (string.IsNullOrEmpty(merchantIdClaim) || !int.TryParse(merchantIdClaim, out var merchantId))
            return null;
        return merchantId;
    }

    private string? GetCurrentUserRole()
    {
        return User.FindFirstValue("role");
    }

    private bool IsCurrentUserSuperAdmin()
    {
        var isSuperAdminClaim = User.FindFirstValue("isSuperAdmin");
        return bool.TryParse(isSuperAdminClaim, out var isSuperAdmin) && isSuperAdmin;
    }

    private bool CanCreateInvites()
    {
        var role = GetCurrentUserRole();
        return IsCurrentUserSuperAdmin() || role == UserRoles.Owner;
    }

    [HttpPost]
    public async Task<ActionResult<CreateInviteResponseDto>> CreateInvite([FromBody] CreateInviteDto dto)
    {
        if (!CanCreateInvites())
            return Forbid("Only Owners and SuperAdmins can create invites");

        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User ID not found in token");

        // Prevent creating invites for Owner role unless current user is SuperAdmin
        if (dto.Role == UserRoles.Owner && !IsCurrentUserSuperAdmin())
            return Forbid("Only SuperAdmins can invite users with Owner role");

        try
        {
            // Get base URL from configuration or request
            var baseUrl = _configuration["Frontend:BaseUrl"] 
                ?? $"{Request.Scheme}://{Request.Host}";

            var result = await _inviteService.CreateInviteAsync(
                dto, 
                merchantId.Value, 
                currentUserId, 
                baseUrl);

            return Ok(result);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("validate/{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<ValidateInviteDto>> ValidateInvite(string token)
    {
        var result = await _inviteService.ValidateInviteTokenAsync(token);
        
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost("accept")]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> AcceptInvite([FromBody] AcceptInviteDto dto)
    {
        try
        {
            var result = await _inviteService.AcceptInviteAsync(dto);
            
            if (result == null)
                return BadRequest(new { message = "Failed to accept invite" });

            return Ok(result);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

