import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

# Title
ax.text(5, 5.6, "Arquitectura de Procesamiento Automático de Imágen (DTF Marketplace)", 
        fontsize=14, fontweight='bold', ha='center', color='#1E293B')

# Boxes
# Box 1: Designer Upload
rect1 = patches.FancyBboxPatch((0.5, 3.2), 2.2, 1.8, boxstyle="round,pad=0.1", ec="#3B82F6", fc="#EFF6FF", lw=2)
ax.add_patch(rect1)
ax.text(1.6, 4.3, "1. Carga Original", fontsize=11, fontweight='bold', ha='center', color='#1E40AF')
ax.text(1.6, 3.6, "• PNG 300 DPI (Transparente)\n• Alta Resolución (Print File)\n• Logotipo del Diseñador", fontsize=8, ha='center', color='#334155')

# Box 2: Processing Engine
rect2 = patches.FancyBboxPatch((3.8, 3.2), 2.4, 1.8, boxstyle="round,pad=0.1", ec="#8B5CF6", fc="#F5F3FF", lw=2)
ax.add_patch(rect2)
ax.text(5.0, 4.3, "2. Motor de Procesamiento", fontsize=11, fontweight='bold', ha='center', color='#5B21B6')
ax.text(5.0, 3.6, "• Redimensión Web (72 DPI / 1000px)\n• Inyección de Marca de Agua\n• Generación de Mockups (Sharp/Canvas)\n• Encriptación de Archivo Original", fontsize=8, ha='center', color='#334155')

# Box 3: Public Preview
rect3 = patches.FancyBboxPatch((7.2, 3.8), 2.3, 1.2, boxstyle="round,pad=0.1", ec="#10B981", fc="#ECFDF5", lw=2)
ax.add_patch(rect3)
ax.text(8.35, 4.5, "3a. Preview Pública", fontsize=10, fontweight='bold', ha='center', color='#065F46')
ax.text(8.35, 4.0, "• Liviana (WebP / JPEG)\n• Con Marca de Agua\n• Lista para Catálogo", fontsize=8, ha='center', color='#334155')

# Box 4: Vault Storage
rect4 = patches.FancyBboxPatch((7.2, 2.0), 2.3, 1.4, boxstyle="round,pad=0.1", ec="#F59E0B", fc="#FEF3C7", lw=2)
ax.add_patch(rect4)
ax.text(8.35, 3.0, "3b. Bóveda Privada", fontsize=10, fontweight='bold', ha='center', color='#92400E')
ax.text(8.35, 2.4, "• PNG Original Intacto\n• Solo accesible tras pago\n• Descarga Directa DTF", fontsize=8, ha='center', color='#334155')

# Arrows
arrow_style = dict(arrowstyle="->", lw=2, color="#64748B")
ax.annotate("", xy=(3.8, 4.1), xytext=(2.7, 4.1), arrowprops=arrow_style)
ax.annotate("", xy=(7.2, 4.4), xytext=(6.2, 4.1), arrowprops=arrow_style)
ax.annotate("", xy=(7.2, 2.7), xytext=(6.2, 4.1), arrowprops=arrow_style)

# Bottom note
rect_bottom = patches.FancyBboxPatch((0.5, 0.5), 9.0, 1.0, boxstyle="round,pad=0.1", ec="#CBD5E1", fc="#F8FAFC", lw=1)
ax.add_patch(rect_bottom)
ax.text(5.0, 1.1, "Usabilidad Total para el Diseñador:", fontsize=10, fontweight='bold', ha='center', color='#0F172A')
ax.text(5.0, 0.7, "El diseñador solo sube 1 archivo HD + su marca de agua una sola vez en su perfil. La plataforma se encarga del 100% de la optimización, seguridad y mockup.", fontsize=8.5, ha='center', color='#475569')

plt.tight_layout()
plt.savefig("arquitectura_procesamiento_dtf.png", dpi=300)