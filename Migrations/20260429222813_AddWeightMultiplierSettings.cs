using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamWorkload.API.Migrations
{
    /// <inheritdoc />
    public partial class AddWeightMultiplierSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeightMultiplierSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Multiplier = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeightMultiplierSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeightMultiplierSettings_Type_Name",
                table: "WeightMultiplierSettings",
                columns: new[] { "Type", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeightMultiplierSettings");
        }
    }
}
