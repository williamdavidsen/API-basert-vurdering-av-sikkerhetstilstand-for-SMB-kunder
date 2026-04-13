using Microsoft.AspNetCore.Mvc;
using SecurityAssessmentAPI.DTOs;
using SecurityAssessmentAPI.Services;

namespace SecurityAssessmentAPI.Controllers.Api
{
    [ApiController]
    [Route("api/ssl")]
    public class SslController : ControllerBase
    {
        private readonly ISslCheckingService _sslCheckingService;
        private readonly ILogger<SslController> _logger;

        public SslController(ISslCheckingService sslCheckingService, ILogger<SslController> logger)
        {
            _sslCheckingService = sslCheckingService;
            _logger = logger;
        }

        [HttpPost("check")]
        public async Task<IActionResult> CheckSsl([FromBody] SslCheckRequest request, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid SSL check request: {Errors}", string.Join(", ", ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))));
                return BadRequest(ModelState);
            }

            try
            {
                _logger.LogInformation("SSL check request received: {Domain}", request.Domain);

                var result = await _sslCheckingService.CheckSslAsync(request.Domain, cancellationToken);

                _logger.LogInformation("SSL check response sent: Domain={Domain}, Status={Status}, Score={Score}",
                    result.Domain, result.Status, result.OverallScore);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during SSL check: {Domain}", request.Domain);
                return StatusCode(500, new { message = "SSL check could not be performed", error = ex.Message });
            }
        }

        [HttpGet("check/{domain}")]
        public async Task<IActionResult> GetSslCheck(string domain, CancellationToken cancellationToken)
        {
            // Support lightweight GET checks for Swagger, browser tests, and scripted demos.
            if (string.IsNullOrWhiteSpace(domain))
            {
                _logger.LogWarning("Invalid domain parameter: {Domain}", domain);
                return BadRequest("Domain is required");
            }

            try
            {
                _logger.LogInformation("SSL check GET request received: {Domain}", domain);

                var result = await _sslCheckingService.CheckSslAsync(domain, cancellationToken);

                _logger.LogInformation("SSL check GET response sent: Domain={Domain}, Status={Status}, Score={Score}",
                    result.Domain, result.Status, result.OverallScore);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during SSL check GET: {Domain}", domain);
                return StatusCode(500, new { message = "SSL check could not be performed", error = ex.Message });
            }
        }

        [HttpGet("details/{domain}")]
        public async Task<IActionResult> GetSslDetails(string domain, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(domain))
            {
                _logger.LogWarning("Invalid SSL details domain parameter: {Domain}", domain);
                return BadRequest("Domain is required");
            }

            try
            {
                _logger.LogInformation("SSL details GET request received: {Domain}", domain);

                var result = await _sslCheckingService.GetSslDetailsAsync(domain, cancellationToken);

                _logger.LogInformation("SSL details GET response sent: Domain={Domain}, Status={Status}, Score={Score}, Source={Source}",
                    result.Domain, result.Status, result.OverallScore, result.DataSource);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during SSL details GET: {Domain}", domain);
                return StatusCode(500, new { message = "SSL details could not be performed", error = ex.Message });
            }
        }
    }
}
