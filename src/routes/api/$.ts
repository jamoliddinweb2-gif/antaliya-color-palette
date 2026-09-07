import { createFileRoute } from "@tanstack/react-router";

type Json = Record<string, any>;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const err = (message: string, status = 400) => json({ error: message }, status);

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function getSetting(key: string, fallback = "") {
  const sb = await db();
  const { data } = await sb.from("settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? fallback;
}

async function setSetting(key: string, value: string) {
  const sb = await db();
  await sb.from("settings").upsert({ key, value, updatedAt: new Date().toISOString() }, { onConflict: "key" });
}

async function body(request: Request): Promise<Json> {
  try {
    return (await request.json()) as Json;
  } catch {
    return {};
  }
}

function num(v: unknown, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

async function enrichOrders(rows: any[]) {
  if (!rows.length) return [];
  const sb = await db();
  const ids = rows.map((o) => o.id);
  const [{ data: items }, { data: customers }, { data: couriers }] = await Promise.all([
    sb.from("order_items").select("*").in("orderId", ids),
    sb.from("customers").select("id,name,phone").in("id", [...new Set(rows.map((o) => o.customerId))]),
    sb.from("couriers").select("id,name,phone,lat,lng").in("id", [
      ...new Set(rows.map((o) => o.courierId).filter(Boolean)),
    ].length
      ? [...new Set(rows.map((o) => o.courierId).filter(Boolean))]
      : [-1]),
  ]);
  const cm = new Map((customers ?? []).map((c: any) => [c.id, c]));
  const km = new Map((couriers ?? []).map((c: any) => [c.id, c]));
  return rows.map((o) => {
    const c = cm.get(o.customerId);
    const k = o.courierId ? km.get(o.courierId) : null;
    return {
      ...o,
      customerName: c?.name ?? null,
      customerPhone: c?.phone ?? null,
      courierName: k?.name ?? null,
      courierPhone: k?.phone ?? null,
      courierLat: k?.lat ?? null,
      courierLng: k?.lng ?? null,
      items: (items ?? []).filter((i: any) => i.orderId === o.id),
    };
  });
}

async function productsWithExtras(rows: any[], customerId: number | null) {
  const sb = await db();
  const catIds = [...new Set(rows.map((p) => p.categoryId).filter(Boolean))];
  const { data: cats } = catIds.length
    ? await sb.from("categories").select("id,name").in("id", catIds)
    : { data: [] };
  const cm = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
  let likedIds = new Set<number>();
  if (customerId) {
    const { data: liked } = await sb.from("liked").select("productId").eq("customerId", customerId);
    likedIds = new Set((liked ?? []).map((l: any) => l.productId));
  }
  return rows.map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
    categoryName: p.categoryId ? cm.get(p.categoryId) ?? null : null,
    isLiked: likedIds.has(p.id),
  }));
}

async function handle(request: Request, splat: string): Promise<Response> {
  const sb = await db();
  const url = new URL(request.url);
  const q = url.searchParams;
  const method = request.method.toUpperCase();
  const path = splat.replace(/^\/+|\/+$/g, "");
  const seg = path.split("/");
  const customerId = Number(request.headers.get("x-customer-id")) || null;
  const courierId = Number(request.headers.get("x-courier-id")) || null;

  // ---- health ----
  if (path === "healthz") return json({ status: "ok" });

  // ---- customers ----
  if (path === "customers/search" && method === "POST") {
    const b = await body(request);
    const { data } = await sb.from("customers").select("*").eq("phone", b.phone).maybeSingle();
    return json({ exists: !!data, customer: data ?? null });
  }
  if (path === "customers/login" && method === "POST") {
    const b = await body(request);
    if (!b.phone) return err("phone required");
    const { data: existing } = await sb.from("customers").select("*").eq("phone", b.phone).maybeSingle();
    if (existing) {
      if (b.name && b.name !== existing.name) {
        const { data: upd } = await sb
          .from("customers")
          .update({ name: b.name })
          .eq("id", existing.id)
          .select()
          .single();
        return json(upd);
      }
      return json(existing);
    }
    const { data, error } = await sb
      .from("customers")
      .insert({ phone: b.phone, name: b.name ?? null })
      .select()
      .single();
    if (error) return err(error.message, 500);
    return json(data);
  }
  if (path === "customers/logout") return json({ success: true });
  if (path === "customers/me") {
    if (!customerId) return err("unauthorized", 401);
    if (method === "GET") {
      const { data } = await sb.from("customers").select("*").eq("id", customerId).maybeSingle();
      return data ? json(data) : err("not found", 404);
    }
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const patch: Json = {};
      for (const k of ["name", "avatarUrl", "language", "savedAddress"]) if (k in b) patch[k] = b[k];
      const { data } = await sb.from("customers").update(patch).eq("id", customerId).select().single();
      return json(data);
    }
  }
  if (path === "customers/me/phone" && (method === "PATCH" || method === "PUT")) {
    if (!customerId) return err("unauthorized", 401);
    const b = await body(request);
    const { data, error } = await sb
      .from("customers")
      .update({ phone: b.phone })
      .eq("id", customerId)
      .select()
      .single();
    if (error) return err(error.message, 400);
    return json(data);
  }
  if (path === "customers" && method === "GET") {
    const { data } = await sb.from("customers").select("*").order("createdAt", { ascending: false });
    return json(data ?? []);
  }
  if (seg[0] === "customers" && seg.length === 2 && method === "DELETE") {
    await sb.from("customers").delete().eq("id", num(seg[1]));
    return json({ success: true });
  }

  // ---- categories ----
  if (path === "categories") {
    if (method === "GET") {
      const { data } = await sb.from("categories").select("*").order("id");
      return json(data ?? []);
    }
    if (method === "POST") {
      const b = await body(request);
      const { data } = await sb.from("categories").insert({ name: b.name, imageUrl: b.imageUrl ?? null }).select().single();
      return json(data);
    }
  }
  if (seg[0] === "categories" && seg.length === 2) {
    const id = num(seg[1]);
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const { data } = await sb.from("categories").update(b).eq("id", id).select().single();
      return json(data);
    }
    if (method === "DELETE") {
      await sb.from("categories").delete().eq("id", id);
      return json({ success: true });
    }
  }

  // ---- products ----
  if (path === "products") {
    if (method === "GET") {
      const page = Math.max(1, num(q.get("page"), 1));
      const limit = Math.min(100, num(q.get("limit"), 20));
      let query = sb.from("products").select("*", { count: "exact" });
      if (q.get("categoryId")) query = query.eq("categoryId", num(q.get("categoryId")));
      if (q.get("search")) query = query.ilike("name", `%${q.get("search")}%`);
      const { data, count } = await query
        .order("createdAt", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      return json({
        products: await productsWithExtras(data ?? [], customerId),
        total: count ?? 0,
        page,
        limit,
      });
    }
    if (method === "POST") {
      const b = await body(request);
      const { data, error } = await sb
        .from("products")
        .insert({
          name: b.name,
          description: b.description ?? null,
          price: num(b.price),
          oldPrice: b.oldPrice ?? null,
          images: b.images ?? [],
          categoryId: b.categoryId ?? null,
          inStock: b.inStock ?? true,
          unit: b.unit ?? "dona",
        })
        .select()
        .single();
      if (error) return err(error.message, 400);
      return json((await productsWithExtras([data], null))[0]);
    }
  }
  if (seg[0] === "products" && seg.length === 2) {
    const id = num(seg[1]);
    if (method === "GET") {
      const { data } = await sb.from("products").select("*").eq("id", id).maybeSingle();
      if (!data) return err("not found", 404);
      return json((await productsWithExtras([data], customerId))[0]);
    }
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const { data } = await sb.from("products").update(b).eq("id", id).select().single();
      return json((await productsWithExtras([data], null))[0]);
    }
    if (method === "DELETE") {
      await sb.from("products").delete().eq("id", id);
      return json({ success: true });
    }
  }

  // ---- banners ----
  if (path === "banners") {
    if (method === "GET") {
      const { data } = await sb.from("banners").select("*").order("sortOrder");
      return json(data ?? []);
    }
    if (method === "POST") {
      const b = await body(request);
      const { data } = await sb.from("banners").insert(b).select().single();
      return json(data);
    }
  }
  if (seg[0] === "banners" && seg.length === 2) {
    const id = num(seg[1]);
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const { data } = await sb.from("banners").update(b).eq("id", id).select().single();
      return json(data);
    }
    if (method === "DELETE") {
      await sb.from("banners").delete().eq("id", id);
      return json({ success: true });
    }
  }

  // ---- cart ----
  if (path === "cart") {
    if (!customerId) return method === "GET" ? json([]) : err("unauthorized", 401);
    if (method === "GET") {
      const { data } = await sb.from("cart").select("*").eq("customerId", customerId).order("id");
      const pids = (data ?? []).map((c: any) => c.productId);
      const { data: prods } = pids.length
        ? await sb.from("products").select("*").in("id", pids)
        : { data: [] };
      const withExtras = await productsWithExtras(prods ?? [], customerId);
      const pm = new Map(withExtras.map((p: any) => [p.id, p]));
      return json((data ?? []).map((c: any) => ({ ...c, product: pm.get(c.productId) ?? null })));
    }
    if (method === "POST") {
      const b = await body(request);
      const { data: existing } = await sb
        .from("cart")
        .select("*")
        .eq("customerId", customerId)
        .eq("productId", b.productId)
        .maybeSingle();
      if (existing) {
        const { data } = await sb
          .from("cart")
          .update({ quantity: existing.quantity + num(b.quantity, 1) })
          .eq("id", existing.id)
          .select()
          .single();
        return json(data);
      }
      const { data } = await sb
        .from("cart")
        .insert({ customerId, productId: b.productId, quantity: num(b.quantity, 1) })
        .select()
        .single();
      return json(data);
    }
    if (method === "DELETE") {
      await sb.from("cart").delete().eq("customerId", customerId);
      return json({ success: true });
    }
  }
  if (seg[0] === "cart" && seg.length === 2) {
    const id = num(seg[1]);
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const { data } = await sb.from("cart").update({ quantity: num(b.quantity, 1) }).eq("id", id).select().single();
      return json(data);
    }
    if (method === "DELETE") {
      await sb.from("cart").delete().eq("id", id);
      return json({ success: true });
    }
  }

  // ---- liked ----
  if (path === "liked") {
    if (!customerId) return method === "GET" ? json([]) : err("unauthorized", 401);
    if (method === "GET") {
      const { data } = await sb.from("liked").select("productId").eq("customerId", customerId);
      const pids = (data ?? []).map((l: any) => l.productId);
      const { data: prods } = pids.length ? await sb.from("products").select("*").in("id", pids) : { data: [] };
      return json(await productsWithExtras(prods ?? [], customerId));
    }
    if (method === "POST") {
      const b = await body(request);
      const { data: existing } = await sb
        .from("liked")
        .select("id")
        .eq("customerId", customerId)
        .eq("productId", b.productId)
        .maybeSingle();
      if (existing) {
        await sb.from("liked").delete().eq("id", existing.id);
        return json({ liked: false });
      }
      await sb.from("liked").insert({ customerId, productId: b.productId });
      return json({ liked: true });
    }
  }

  // ---- promo codes ----
  if (path === "promo-codes/apply" && method === "POST") {
    const b = await body(request);
    const { data: promo } = await sb
      .from("promo_codes")
      .select("*")
      .eq("code", String(b.code ?? "").toUpperCase())
      .eq("isActive", true)
      .maybeSingle();
    if (!promo) return err("Promokod topilmadi", 404);
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return err("Promokod limiti tugagan", 400);
    const total = num(b.totalPrice ?? b.total);
    const discountAmount =
      promo.discountType === "percent"
        ? Math.round((total * promo.discountAmount) / 100)
        : promo.discountAmount;
    return json({
      discountAmount,
      promoCode: promo.code,
      discountType: promo.discountType,
      discountPercent: promo.discountType === "percent" ? promo.discountAmount : null,
    });
  }
  if (path === "promo-codes") {
    if (method === "GET") {
      const { data } = await sb.from("promo_codes").select("*").order("createdAt", { ascending: false });
      return json(data ?? []);
    }
    if (method === "POST") {
      const b = await body(request);
      const { data, error } = await sb
        .from("promo_codes")
        .insert({
          code: String(b.code).toUpperCase(),
          discountType: b.discountType ?? "fixed",
          discountAmount: num(b.discountAmount),
          maxUses: b.maxUses ?? null,
          isActive: b.isActive ?? true,
        })
        .select()
        .single();
      if (error) return err(error.message, 400);
      return json(data);
    }
  }
  if (seg[0] === "promo-codes" && seg.length === 2) {
    const id = num(seg[1]);
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const { data } = await sb.from("promo_codes").update(b).eq("id", id).select().single();
      return json(data);
    }
    if (method === "DELETE") {
      await sb.from("promo_codes").delete().eq("id", id);
      return json({ success: true });
    }
  }

  // ---- orders ----
  if (path === "orders" || path === "admin/orders") {
    if (method === "GET") {
      let query = sb.from("orders").select("*");
      if (path === "orders" && customerId && !q.get("all")) query = query.eq("customerId", customerId);
      if (q.get("status")) query = query.eq("status", q.get("status"));
      if (q.get("customerId")) query = query.eq("customerId", num(q.get("customerId")));
      const { data } = await query.order("createdAt", { ascending: false }).limit(500);
      return json(await enrichOrders(data ?? []));
    }
    if (method === "POST") {
      if (!customerId) return err("unauthorized", 401);
      const b = await body(request);
      const items: any[] = b.items ?? [];
      const deliveryFee = num(b.deliveryFee, 0);
      const totalPrice = num(
        b.totalPrice,
        items.reduce((s, i) => s + num(i.price) * num(i.quantity, 1), 0) + deliveryFee,
      );
      const { data: order, error } = await sb
        .from("orders")
        .insert({
          customerId,
          status: "new",
          deliveryMethod: b.deliveryMethod ?? "delivery",
          paymentMethod: b.paymentMethod ?? "cash",
          address: b.address ?? null,
          note: b.note ?? null,
          promoCode: b.promoCode ?? null,
          discountAmount: num(b.discountAmount, 0),
          totalPrice,
          deliveryFee,
        })
        .select()
        .single();
      if (error) return err(error.message, 400);
      if (items.length) {
        await sb.from("order_items").insert(
          items.map((i) => ({
            orderId: order.id,
            productId: i.productId ?? null,
            productName: i.productName ?? i.name ?? "",
            productImage: i.productImage ?? i.image ?? null,
            quantity: num(i.quantity, 1),
            price: num(i.price),
          })),
        );
      }
      await sb.from("cart").delete().eq("customerId", customerId);
      if (b.promoCode) {
        const { data: promo } = await sb.from("promo_codes").select("*").eq("code", b.promoCode).maybeSingle();
        if (promo) {
          await sb.from("promo_codes").update({ usedCount: promo.usedCount + 1 }).eq("id", promo.id);
          await sb
            .from("promo_code_usages")
            .insert({ promoCodeId: promo.id, customerId, orderId: order.id });
        }
      }
      return json((await enrichOrders([order]))[0]);
    }
  }
  if ((seg[0] === "orders" || (seg[0] === "admin" && seg[1] === "orders")) && seg.length >= 2) {
    const base = seg[0] === "admin" ? 2 : 1;
    const id = num(seg[base]);
    const action = seg[base + 1];
    if (!action && method === "GET") {
      const { data } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
      if (!data) return err("not found", 404);
      return json((await enrichOrders([data]))[0]);
    }
    if (!action && (method === "PATCH" || method === "PUT")) {
      const b = await body(request);
      const { data } = await sb.from("orders").update(b).eq("id", id).select().single();
      return json((await enrichOrders([data]))[0]);
    }
    if ((!action && method === "DELETE") || action === "delete") {
      await sb.from("orders").delete().eq("id", id);
      return json({ success: true });
    }
    if (action === "status" && (method === "PATCH" || method === "PUT" || method === "POST")) {
      const b = await body(request);
      const { data } = await sb.from("orders").update({ status: b.status }).eq("id", id).select().single();
      return json((await enrichOrders([data]))[0]);
    }
    if (action === "assign-courier") {
      const b = await body(request);
      const { data } = await sb
        .from("orders")
        .update({ courierId: b.courierId ?? null })
        .eq("id", id)
        .select()
        .single();
      return json((await enrichOrders([data]))[0]);
    }
  }

  // ---- messages ----
  if (path === "messages") {
    if (method === "GET") {
      const cid = num(q.get("customerId"), customerId ?? 0);
      if (!cid) return json([]);
      const { data } = await sb.from("messages").select("*").eq("customerId", cid).order("createdAt");
      return json(data ?? []);
    }
    if (method === "POST") {
      const b = await body(request);
      const cid = b.customerId ?? customerId;
      if (!cid) return err("unauthorized", 401);
      const { data } = await sb
        .from("messages")
        .insert({
          customerId: cid,
          senderType: b.senderType ?? "customer",
          text: b.text ?? "",
          mediaUrl: b.mediaUrl ?? null,
          mediaType: b.mediaType ?? null,
        })
        .select()
        .single();
      return json(data);
    }
    if (method === "DELETE") {
      const cid = num(q.get("customerId"), customerId ?? 0);
      if (cid) await sb.from("messages").delete().eq("customerId", cid);
      return json({ success: true });
    }
  }
  if (path === "messages/read" && (method === "POST" || method === "PATCH")) {
    const b = await body(request);
    const cid = b.customerId ?? customerId;
    if (cid) await sb.from("messages").update({ isRead: true }).eq("customerId", cid);
    return json({ success: true });
  }
  if (path === "admin/messages" && method === "GET") {
    const { data: msgs } = await sb.from("messages").select("*").order("createdAt", { ascending: false });
    const { data: customers } = await sb.from("customers").select("id,name,phone");
    const cm = new Map((customers ?? []).map((c: any) => [c.id, c]));
    const seen = new Map<number, any>();
    for (const m of msgs ?? []) {
      if (!seen.has(m.customerId)) {
        const c = cm.get(m.customerId);
        seen.set(m.customerId, {
          customerId: m.customerId,
          customerName: c?.name ?? null,
          customerPhone: c?.phone ?? null,
          lastMessage: m.text,
          lastMessageAt: m.createdAt,
          unreadCount: 0,
        });
      }
      if (!m.isRead && m.senderType === "customer") seen.get(m.customerId).unreadCount += 1;
    }
    return json([...seen.values()]);
  }
  if (seg[0] === "admin" && seg[1] === "messages" && seg.length === 3) {
    const cid = num(seg[2]);
    if (method === "GET") {
      const { data } = await sb.from("messages").select("*").eq("customerId", cid).order("createdAt");
      return json(data ?? []);
    }
    if (method === "DELETE") {
      await sb.from("messages").delete().eq("customerId", cid);
      return json({ success: true });
    }
  }

  // ---- notifications ----
  if (path === "notifications" && method === "GET") {
    const { data } = await sb.from("notifications").select("*").order("createdAt", { ascending: false }).limit(50);
    return json(data ?? []);
  }
  if (path === "notifications/send" && method === "POST") {
    const b = await body(request);
    const { data } = await sb.from("notifications").insert({ message: b.message }).select().single();
    return json(data);
  }
  if (path === "notifications/read" && (method === "POST" || method === "PATCH")) {
    if (customerId)
      await sb
        .from("customers")
        .update({ lastNotificationReadAt: new Date().toISOString() })
        .eq("id", customerId);
    return json({ success: true });
  }
  if (seg[0] === "notifications" && seg.length === 2 && method === "DELETE") {
    await sb.from("notifications").delete().eq("id", num(seg[1]));
    return json({ success: true });
  }

  // ---- settings ----
  if (path === "support-contact" || path === "admin/support-contact") {
    if (method === "GET") {
      return json({
        phone: await getSetting("supportPhone", ""),
        telegram: await getSetting("supportTelegram", ""),
      });
    }
    const b = await body(request);
    if (b.phone !== undefined) await setSetting("supportPhone", String(b.phone));
    if (b.telegram !== undefined) await setSetting("supportTelegram", String(b.telegram));
    return json({ success: true });
  }
  if (path === "site-settings" || path === "admin/site-settings") {
    if (method === "GET") {
      return json({
        siteName: await getSetting("siteName", "Como Pizza"),
        logoUrl: await getSetting("logoUrl", ""),
      });
    }
    const b = await body(request);
    if (b.siteName !== undefined) await setSetting("siteName", String(b.siteName));
    if (b.logoUrl !== undefined) await setSetting("logoUrl", String(b.logoUrl));
    return json({ success: true });
  }
  if (path === "delivery") {
    if (method === "GET") {
      return json({
        deliveryFee: num(await getSetting("deliveryFee", "15000")),
        freeDeliveryThreshold: num(await getSetting("freeDeliveryThreshold", "200000")),
        estimatedMinutes: num(await getSetting("estimatedMinutes", "40")),
      });
    }
    const b = await body(request);
    for (const k of ["deliveryFee", "freeDeliveryThreshold", "estimatedMinutes"])
      if (b[k] !== undefined) await setSetting(k, String(b[k]));
    return json({ success: true });
  }
  if (path === "admin/delivery-zone") {
    if (method === "GET") {
      const raw = await getSetting("deliveryZone", "");
      return json(raw ? JSON.parse(raw) : null);
    }
    const b = await body(request);
    await setSetting("deliveryZone", JSON.stringify(b));
    return json({ success: true });
  }
  if (path === "work-schedule" || path === "admin/work-schedule") {
    if (method === "GET") {
      const raw = await getSetting("workSchedule", "");
      return json(raw ? JSON.parse(raw) : { isAlwaysOpen: true, days: [] });
    }
    const b = await body(request);
    await setSetting("workSchedule", JSON.stringify(b));
    return json({ success: true });
  }
  if (path === "admin/telegram-admins") {
    if (method === "GET") {
      const raw = await getSetting("telegramAdmins", "[]");
      return json(JSON.parse(raw || "[]"));
    }
    const b = await body(request);
    await setSetting("telegramAdmins", JSON.stringify(b.ids ?? b));
    return json({ success: true });
  }

  // ---- admin auth ----
  if (path === "admin/login" && method === "POST") {
    const b = await body(request);
    const pw = await getSetting("adminPassword", "admin123");
    if (b.password !== pw) return err("Parol noto'g'ri", 401);
    return json({ success: true });
  }
  if (path === "admin/logout") return json({ success: true });
  if (path === "admin/password" && (method === "POST" || method === "PATCH" || method === "PUT")) {
    const b = await body(request);
    const pw = await getSetting("adminPassword", "admin123");
    if (b.currentPassword !== pw) return err("Joriy parol noto'g'ri", 401);
    await setSetting("adminPassword", String(b.newPassword));
    return json({ success: true });
  }
  if (path === "admin/chef-password") {
    if (method === "GET") return json({ password: await getSetting("chefPassword", "chef123") });
    const b = await body(request);
    await setSetting("chefPassword", String(b.password ?? b.newPassword));
    return json({ success: true });
  }

  // ---- couriers ----
  if (path === "couriers") {
    if (method === "GET") {
      const { data } = await sb.from("couriers").select("*").order("id");
      return json(data ?? []);
    }
    if (method === "POST") {
      const b = await body(request);
      const { data, error } = await sb.from("couriers").insert(b).select().single();
      if (error) return err(error.message, 400);
      return json(data);
    }
  }
  if (seg[0] === "couriers" && seg.length === 2) {
    const id = num(seg[1]);
    if (method === "PATCH" || method === "PUT") {
      const b = await body(request);
      const { data } = await sb.from("couriers").update(b).eq("id", id).select().single();
      return json(data);
    }
    if (method === "DELETE") {
      await sb.from("couriers").delete().eq("id", id);
      return json({ success: true });
    }
  }
  if (path === "courier/login" && method === "POST") {
    const b = await body(request);
    const { data } = await sb
      .from("couriers")
      .select("*")
      .eq("username", b.username)
      .eq("password", b.password)
      .maybeSingle();
    if (!data) return err("Login yoki parol noto'g'ri", 401);
    return json({ id: data.id, name: data.name, phone: data.phone, username: data.username });
  }
  if (path === "courier/location" && (method === "POST" || method === "PATCH")) {
    if (!courierId) return err("unauthorized", 401);
    const b = await body(request);
    await sb
      .from("couriers")
      .update({ lat: b.lat, lng: b.lng, locationUpdatedAt: new Date().toISOString() })
      .eq("id", courierId);
    return json({ success: true });
  }
  if (path === "courier/orders" && method === "GET") {
    if (!courierId) return err("unauthorized", 401);
    const { data } = await sb
      .from("orders")
      .select("*")
      .or(`courierId.eq.${courierId},courierId.is.null`)
      .order("createdAt", { ascending: false });
    return json(await enrichOrders(data ?? []));
  }
  if (seg[0] === "courier" && seg[1] === "orders" && seg.length === 4) {
    if (!courierId) return err("unauthorized", 401);
    const id = num(seg[2]);
    const patch =
      seg[3] === "accept" ? { courierId, status: "delivering" } : { status: "delivered" };
    const { data } = await sb.from("orders").update(patch).eq("id", id).select().single();
    return json((await enrichOrders([data]))[0]);
  }

  // ---- chef ----
  if (path === "chef/login" && method === "POST") {
    const b = await body(request);
    const pw = await getSetting("chefPassword", "chef123");
    if (b.password !== pw) return err("Parol noto'g'ri", 401);
    return json({ success: true });
  }
  if (path === "chef/orders" && method === "GET") {
    const { data } = await sb
      .from("orders")
      .select("*")
      .in("status", ["new", "preparing"])
      .order("createdAt", { ascending: false });
    return json(await enrichOrders(data ?? []));
  }
  if (seg[0] === "chef" && seg[1] === "orders" && seg[3] === "status") {
    const b = await body(request);
    const { data } = await sb.from("orders").update({ status: b.status }).eq("id", num(seg[2])).select().single();
    return json((await enrichOrders([data]))[0]);
  }
  if (path === "chef/messages" && method === "GET") {
    const { data } = await sb.from("messages").select("*").order("createdAt", { ascending: false }).limit(100);
    return json(data ?? []);
  }

  // ---- stats ----
  if (path === "stats/dashboard") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [{ data: orders }, { count: customerCount }] = await Promise.all([
      sb.from("orders").select("status,totalPrice,createdAt"),
      sb.from("customers").select("id", { count: "exact", head: true }),
    ]);
    const all = orders ?? [];
    const todays = all.filter((o: any) => new Date(o.createdAt) >= today);
    return json({
      totalOrders: all.length,
      totalCustomers: customerCount ?? 0,
      totalRevenue: all.reduce((s: number, o: any) => s + num(o.totalPrice), 0),
      newOrders: all.filter((o: any) => o.status === "new").length,
      preparingOrders: all.filter((o: any) => o.status === "preparing").length,
      deliveredOrders: all.filter((o: any) => o.status === "delivered").length,
      todayRevenue: todays.reduce((s: number, o: any) => s + num(o.totalPrice), 0),
      todayOrders: todays.length,
    });
  }
  if (path === "stats/orders-by-status") {
    const { data } = await sb.from("orders").select("status");
    const counts: Record<string, number> = {};
    for (const o of data ?? []) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return json(Object.entries(counts).map(([status, count]) => ({ status, count })));
  }
  if (path === "stats/recent-orders") {
    const { data } = await sb.from("orders").select("*").order("createdAt", { ascending: false }).limit(10);
    return json(await enrichOrders(data ?? []));
  }

  // ---- upload ----
  if (path === "upload" && method === "POST") {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return err("file required");
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage
      .from("uploads")
      .upload(key, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
    if (error) return err(error.message, 500);
    const { data } = sb.storage.from("uploads").getPublicUrl(key);
    return json({ url: data.publicUrl, fileUrl: data.publicUrl });
  }

  if (path === "telegram-webhook") return json({ ok: true });

  return err(`Not found: /${path}`, 404);
}

const route = async ({ request, params }: { request: Request; params: { _splat?: string } }) => {
  try {
    return await handle(request, params._splat ?? "");
  } catch (e: any) {
    console.error("API error", e);
    return err(e?.message ?? "Server error", 500);
  }
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: route,
      POST: route,
      PUT: route,
      PATCH: route,
      DELETE: route,
    },
  },
});
