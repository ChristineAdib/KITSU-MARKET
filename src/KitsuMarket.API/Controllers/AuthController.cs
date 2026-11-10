using System.Security.Claims;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.Data.Seed;
using KitsuMarket.API.DTOs.Auth;
using KitsuMarket.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KitsuMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new customer account.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return Conflict(new { message = "An account with this email address already exists." });
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Registration failed.",
                errors = result.Errors.Select(e => e.Description)
            });
        }

        // Automatically assign the Customer role
        await _userManager.AddToRoleAsync(user, DbInitializer.CustomerRole);

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAtUtc) = _tokenService.GenerateToken(user, roles);

        var response = new AuthResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email!,
            Roles = roles,
            Token = token,
            ExpiresAtUtc = expiresAtUtc
        };

        _logger.LogInformation("New customer registered: {Email} (Id: {Id})", user.Email, user.Id);
        return CreatedAtAction(nameof(Me), null, response);
    }

    /// <summary>
    /// Authenticate user and receive a JWT token.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAtUtc) = _tokenService.GenerateToken(user, roles);

        var response = new AuthResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email!,
            Roles = roles,
            Token = token,
            ExpiresAtUtc = expiresAtUtc
        };

        _logger.LogInformation("User logged in successfully: {Email}", user.Email);
        return Ok(response);
    }

    /// <summary>
    /// Get authenticated user profile details.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User identifier claim not found." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User account not found." });
        }

        var roles = await _userManager.GetRolesAsync(user);

        var profile = new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Roles = roles,
            CreatedAtUtc = user.CreatedAtUtc
        };

        return Ok(profile);
    }
}
