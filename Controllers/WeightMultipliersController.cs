using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamWorkload.API.Data;

namespace TeamWorkload.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/weight-multipliers")]
    [ApiController]
    public class WeightMultipliersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WeightMultipliersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var settings = await _context.WeightMultiplierSettings
                .OrderBy(x => x.Type)
                .ThenBy(x => x.Id)
                .ToListAsync();

            return Ok(settings);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateWeightMultiplierDto dto)
        {
            var setting = await _context.WeightMultiplierSettings.FindAsync(id);

            if (setting == null)
                return NotFound(new { message = "Multiplier setting not found." });

            if (dto.Multiplier <= 0)
                return BadRequest(new { message = "Multiplier must be greater than zero." });

            setting.Multiplier = dto.Multiplier;

            await _context.SaveChangesAsync();

            return Ok(setting);
        }
    }

    public class UpdateWeightMultiplierDto
    {
        public double Multiplier { get; set; }
    }
}